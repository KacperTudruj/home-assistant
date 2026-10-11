# Plan: moduł wykresów i analiza auta

Status: **etap 1 DONE / do review; etapy 2–3 do zrobienia**.

## Cel i zakres

Osobna strona **„Analiza auta”**, otwierana przyciskiem z widoku samochodu. Pokazuje
spalanie, koszt przejazdu i ceny paliwa, wzorowane na przesłanym zrzucie Excela.
Wejście na zwykły widok auta lub dodanie tankowania nie uruchamia generowania ani
pobierania wykresów. Dotychczasowe statystyki pozostają osobnym elementem widoku.

Powstaje ogólny moduł `charts`: moduł samochodów określa wykres i przekazuje mu dane.
Inne moduły będą mogły używać tego samego kontraktu. Na początku wszystko działa
w jednym procesie; granica modułu umożliwi późniejszą komunikację HTTP bez zmiany
obliczeń samochodowych i formatu odpowiedzi dla frontendu.

Pierwsza wersja obejmuje cztery wykresy paliwowe. Dodatkowe pomysły poniżej są
propozycjami na później, a nie automatycznym rozszerzeniem zakresu.

## Co mamy obecnie

- [Schemat bazy](../prisma/schema.prisma) zawiera datę tankowania, litry, cenę całkowitą,
  przebieg, opcjonalny dystans `tripDistance`, rodzaj paliwa i tryb jazdy.
  Istnieje indeks po samochodzie i dacie. Nie ma informacji o tankowaniu do pełna.
- [Statystyki paliwa](../src/modules/car/application/GetFuelStatisticsUseCase.ts)
  preferują dystans podany ręcznie, a następnie różnicę przebiegów.
  [Kontroler paliwa](../src/modules/car/interface/FuelController.ts) ma też własne
  obliczenia dla historii, oparte na różnicy przebiegów. Reguły nie są identyczne.
- [Frontend auta](../public/js/modules/car-log.js) pobiera już historię i statystyki.
  Nowe wykresy nie powinny dodawać do tych operacji kolejnych żądań.
- [Trasy samochodów](../src/modules/car/interface/CarRoutes.ts) obsługują obecnie
  dodawanie tankowań; nie ma jeszcze tras edycji/usuwania tankowania.

Nie przepisujemy przy okazji całego modułu samochodów. Nowe obliczenia mają jeden
testowalny kalkulator. Ewentualne podpięcie starych statystyk pod niego wymaga osobnego
review różnic wyników; nie zmieniamy po cichu istniejących odpowiedzi API.

## Wykresy pierwszej wersji

Oś X to rzeczywista data tankowania, nie numer pustego wiersza z Excela. Szczegóły
punktu pokazują datę, wartość i jednostkę; jeśli dostępne — dystans i przebieg.

| Nazwa | Jednostka | Znaczenie |
| --- | --- | --- |
| Szacowane spalanie | l/100 km | `100 × litry / dystans`; linia kolejnych tankowań |
| Zmiana spalania względem ostatnich tankowań | l/100 km | Średnia poprzednich 5 poprawnych tankowań minus aktualne spalanie; plus oznacza poprawę |
| Szacowany koszt paliwa na 100 km | zł/100 km | `100 × cena tankowania / dystans`; bez kosztów serwisu |
| Cena paliwa przy tankowaniu | zł/l | Cena całkowita podzielona przez litry; niezależna od dostępności przebiegu |

**Założenie do review:** ze zrzutu nie wynika wzór „Lepiej (+) gorzej (-)”. Proponujemy
średnią ważoną dystansem poprzednich pięciu poprawnych tankowań, bez bieżącego punktu.
Wymagamy pięciu poprzedników; wcześniej pokazujemy brak porównania. Linia zera i opis
„+ mniejsze spalanie, − większe spalanie” wyjaśniają znak. To propozycja nowej reguły,
nie deklaracja odtworzenia wzoru z Excela. Alternatywą na później jest ręczny cel
spalania; nie dodajemy teraz formularza ani trwałego ustawienia celu.

### Reguły danych i obliczeń

- Dodatni, skończony `tripDistance` ma pierwszeństwo. W przeciwnym razie używamy
  dodatniej różnicy wiarygodnych przebiegów kolejnych wpisów. Historyczne zero
  oznaczające brak odczytu nie może stać się podstawą ogromnego dystansu.
- Ustalamy i testujemy wspólną granicę poprawnego dystansu dla nowych wykresów:
  `0 < dystans < 10 000 km`, zgodnie z zabezpieczeniem obecnych statystyk ogólnych.
  Pominięcie punktu musi mieć powód w metadanych odpowiedzi.
- Brak poprzedniego wpisu bez podanego dystansu, cofnięty licznik, niepoprawne litry
  lub kwoty nie dają zera, `NaN` ani nieskończoności. Niepoprawna metryka jest `null`;
  inne poprawne metryki tego tankowania mogą pozostać widoczne.
- Obliczamy bez zaokrąglania pośredniego; zaokrąglamy prezentację. Średnie spalania
  i kosztu ważymy dystansem, a cenę litra liczbą litrów, zamiast uśredniać ilorazy.
- Najpierw wyznaczamy odcinki na pełnej chronologii, dopiero potem filtrujemy punkty.
  Początek zakresu wymaga poprzednika sprzed zakresu; porównanie wymaga dodatkowej
  historii dla pięciu poprzednich poprawnych tankowań. Zmiana zakresu dat nie może
  zmienić wartości tego samego punktu.
- Daty API: `YYYY-MM-DD`, zakres włącznie; zapytanie używa końca wyłącznego kolejnego
  dnia. Dla istniejących dat tankowania zachowujemy konwencję UTC API, bez przesunięć
  dnia przez strefę przeglądarki. Sortowanie musi być deterministyczne. Przy tej samej
  dacie używamy wiarygodnych przebiegów do ustalenia kolejności, następnie ID do
  stabilnego wyświetlania; samo ID nie dowodzi kolejności jazdy. Niejednoznacznego
  odcinka nie obliczamy z różnicy liczników.
- Nie łączymy bez wyjaśnienia różnych paliw. Cena litra ma osobne serie według paliwa.
  Spalanie, koszt i porównanie dotyczą wybranego paliwa; nie liczymy dystansu między
  wpisami uzyskanymi przez usunięcie tankowań innego paliwa. Odcinki przy zmianie
  paliwa pomijamy. Dla aut używających równolegle np. LPG i benzyny zaznaczamy, że
  dane nie pozwalają ustalić całkowitego spalania ani pełnego kosztu przejazdu.
- Bez informacji „do pełna” nie da się wiarygodnie rozliczać dolewek. Widok zawiera
  krótkie wyjaśnienie szacunków i licznik pominiętych punktów. Nie próbujemy zgadywać
  tankowań do pełna ani uzupełniać historycznych danych automatycznie.

## Podział odpowiedzialności

```text
Strona Analiza auta
    → GET /api/cars/:id/analytics?from=...&to=...&fuelType=...
    → car: cache, odczyt danych, kalkulator metryk, wybór wykresów
    → ChartGenerator: ogólny kontrakt asynchroniczny
    → charts: walidacja i przygotowanie specyfikacji wykresów
    → jedna odpowiedź JSON ze wszystkimi wykresami
    → wspólny renderer w przeglądarce
```

**Samochody** znają litry, przebiegi, reguły porównań i źródła danych. Dostęp do Prisma
jest w adapterze repozytorium, kalkulator pozostaje czystą logiką. Kontroler zajmuje się
HTTP; zależności są składane ręcznie w [composition root](../src/index.ts).

**Moduł charts** nie importuje modułu samochodów, Prisma ani modeli bazy. Przyjmuje
serializowalny opis: wersję kontraktu, ID wykresu, typ (`line`/`bar`), tytuł, osie,
jednostki, serie punktów i opcjonalną linię odniesienia. Zwraca wersjonowany model
do renderowania. Waliduje m.in. obsługiwany typ, liczby, limity serii i punktów.
Nie przyjmuje funkcji JavaScript, HTML ani dowolnych opcji konkretnej biblioteki.
W pierwszej wersji implementujemy tylko typy faktycznie używane przez cztery wykresy.

**Frontend** ma jeden wspólny renderer dla specyfikacji, a strona auta obsługuje
nawigację, filtry i stany widoku. Dobór biblioteki nastąpi w etapie frontendu po
sprawdzeniu licencji, dostępności i obsługi lokalnych zasobów. Biblioteka będzie
izolowana w adapterze; bez nowego frameworka i zależności od CDN podczas działania.

Przez „generowanie” rozumiemy przygotowanie interaktywnego wykresu: backend dostarcza
gotową specyfikację, przeglądarka ją rysuje. Renderowanie PNG/PDF na serwerze jest
osobną przyszłą funkcją, nie kosztem każdego wejścia na stronę.

Proponowane nowe lokalizacje: `src/modules/charts/{domain,application,infrastructure}`,
część analityczna w istniejącym `src/modules/car`, strona `src/pages/car-analytics.html`
i moduły JS w `public/js/modules`. Nie tworzymy pustych warstw ani publicznego endpointu
ogólnego generatora, jeśli lokalne wywołanie wystarcza.

### Późniejsze wydzielenie usługi

Kontrakt `ChartGenerator` ma postać `generate(request): Promise<response>`, z prostym
JSON bez obiektów Prisma i instancji klas. Początkowo wywołuje lokalny moduł. Później
adapter HTTP prześle ten sam kontrakt do osobnej usługi; reguły samochodowe i odczyt
bazy pozostaną w module car. Timeout, błędy transportu, uwierzytelnienie między usługami
i zgodność wersji kontraktu będą częścią etapu wydzielania. Teraz nie dodajemy osobnego
kontenera, brokera, kolejki ani automatycznych retry.

## Pobieranie danych i cache

1. Strona `/car-analytics?carId=...` domyślnie pokazuje ostatnie 12 miesięcy. Dostępne
   zakresy: 3/6/12 miesięcy i własny zakres, maksymalnie 5 lat na jedno zapytanie.
   Jedno żądanie analityczne zwraca wszystkie cztery wykresy, dane auta potrzebne
   nagłówkowi, dostępne paliwa, zastosowane filtry, czas obliczenia i informacje
   o jakości danych. Nie wykonujemy osobnego zapytania dla każdego punktu/wykresu.
2. Pobieramy potrzebny zakres i ograniczony kontekst wcześniejszych tankowań,
   wspólnie dla wszystkich metryk. Odczyt maksymalnie 5 000 rekordów na operację
   (łącznie z kontekstem); do 1 000 punktów na serię. Po przekroczeniu limitu API
   zwraca czytelny błąd wymagający węższego zakresu, bez cichego obcięcia wyników.
   Nie wprowadzamy teraz agregowania miesięcznego, które zmieniłoby znaczenie punktów.
3. Cache odpowiedzi w pamięci procesu: TTL 5 minut, maksymalnie 100 wpisów, dodatkowy
   łączny limit 20 MiB serializowanych odpowiedzi. Usuwanie najdawniej używanych wpisów;
   zbyt dużej odpowiedzi nie zapisujemy. Limity to wartości startowe do weryfikacji.
4. Klucz obejmuje auto, znormalizowany zakres i paliwo oraz wersję obliczeń/kontraktu.
   Przy przyszłych uprawnieniach uwzględnia też właściciela; cache nie zastępuje
   sprawdzania dostępu do samochodu. Równoczesne identyczne odczyty współdzielą jedną
   obietnicę obliczenia. Błędy nie trafiają do cache, wpisy trwających obliczeń są
   usuwane również po błędzie i mają ograniczoną liczbę.
5. Udany zapis tankowania usuwa wszystkie warianty cache tego auta. Dotyczy także
   wpisów z datą wsteczną. Usunięcie auta unieważnia jego dane, jeśli taka operacja
   jest dostępna. Przyszłe edycje/usuwanie paliwa muszą korzystać z tego samego
   mechanizmu. Sam zapis nie generuje wykresów. Serwis i przypomnienia nie wpływają
   na pierwsze cztery wykresy, więc nie podpinamy ich bez potrzeby.
6. Unieważnienie musi obejmować też trwające obliczenia: wynik rozpoczęty przed
   zapisem nie może ponownie zapełnić cache ani zostać użyty przez nowe żądanie po
   zapisie. Prosty licznik generacji per auto lub token zadania; pomocnicze mapy
   również wymagają ograniczenia pamięci. Testujemy ten wyścig.
7. Frontend pobiera dane przy wejściu i po zatwierdzeniu zmiany filtrów, bez pollingu
   i prefetchu na stronie auta. Zmiana pól filtra nie wysyła żądania, dopóki użytkownik
   nie kliknie „Pokaż”. Anulujemy nieaktualne pobrania i ignorujemy spóźnione odpowiedzi.
   Ponowne rysowanie/zmiana rozmiaru nie pobierają danych. Nie dodajemy drugiego
   trwałego cache w przeglądarce; odpowiedzi HTTP nie powinny maskować unieważnienia
   backendu. Przycisk ponowienia po błędzie korzysta ze zwykłego endpointu.

Cache jest lokalny dla jednej instancji API i znika przy restarcie. Zmiana danych
poza aplikacją może być widoczna dopiero po TTL. To wystarczy obecnemu wdrożeniu.
Przed uruchomieniem wielu replik należy zapewnić wspólne unieważnianie lub wspólną
wersję danych; można wtedy podmienić adapter cache, np. na współdzielony magazyn.
Nie wdrażamy rozproszonej infrastruktury na zapas.

## Etapy realizacji

Każdy etap to większa, spójna partia do review. Po wykonaniu zmieniamy nagłówek na
`### DONE N. ...`, zaznaczamy checklistę i dopisujemy rzeczywiste wyniki walidacji.
Zatrzymujemy się na review między etapami. Zmiany pozostają bez commitów i stagingu,
zgodnie z aktualnymi instrukcjami repozytorium.

### DONE 1. Kontrakt wykresów i obliczenia samochodowe

- [x] Wprowadzić niezależny moduł charts, kontrakt JSON i lokalny generator specyfikacji.
- [x] Zaimplementować czysty kalkulator czterech metryk i przygotowanie wykresów w car.
- [x] Obsłużyć chronologię, jednostki, puste dane, paliwa i opisane ograniczenia jakości.
- [x] Dodać testy jednostkowe bez bazy, Expressa i Dockera: wzory, średnie ważone,
  pięciu poprzedników, granice dat/dystansu, brak danych, niejednoznaczna kolejność,
  różne paliwa oraz walidacja kontraktu i limity generatora.
- [x] Uruchomić testy i `npx.cmd tsc --noEmit`; zapisać wyniki i ewentualne różnice
  względem obecnych statystyk. Nie przełączać starych endpointów bez review.

**Odbiór:** te same dane dają deterministyczne wyniki, charts nie zna samochodów,
a przykładowa specyfikacja przechodzi serializację JSON w obie strony.

Realizacja:

- [Kontrakt](../src/modules/charts/domain/ChartGenerator.ts) i
  [lokalny generator](../src/modules/charts/application/LocalChartGenerator.ts):
  wersja 1, wykresy liniowe z osią dat, jednostki, szczegóły punktów, linie odniesienia,
  jawne luki `null`, walidacja w czasie wykonania, limity i niezależna kopia JSON.
- [Kalkulator](../src/modules/car/domain/FuelAnalyticsCalculator.ts) i
  [przygotowanie wykresów](../src/modules/car/application/GenerateFuelChartsUseCase.ts):
  cztery wykresy, porównanie z pięcioma poprzednikami, osobne serie cen paliw,
  przyczyny brakujących metryk i liczniki pominięć. Wywołujący dostarcza historię
  razem z kontekstem sprzed zakresu; odczyt bazy będzie częścią etapu 2.
- Testy odzwierciedlają ścieżki źródeł: [generator](../tests/modules/charts/application/LocalChartGenerator.test.cjs),
  [kalkulator](../tests/modules/car/domain/FuelAnalyticsCalculator.test.cjs),
  [use case](../tests/modules/car/application/GenerateFuelChartsUseCase.test.cjs).
  51 nowych testów; pełne `npm.cmd test`: **176/176 OK**. TypeScript i diff check: OK.

Decyzje i różnice względem istniejących statystyk do review:

- Nie przełączono starych endpointów. Nowe wyniki nie są zaokrąglane przed prezentacją,
  odrzucają zerowe odczyty licznika i oddzielają paliwa. Błędna kwota nie usuwa poprawnego
  spalania, a błędne litry nie usuwają poprawnego kosztu na dystans.
- Przy niejednoznacznej kolejności całego dnia ostrożnie pomijamy metryki dystansowe
  również z podanym `tripDistance`, aby nie tworzyć porównania z arbitralnie wybranymi
  poprzednikami. Cena litra pozostaje dostępna. Następny dzień może użyć własnego
  dystansu, ale nie różnicy z niejednoznacznym poprzednikiem.
- Istniejący enum zawiera `ELECTRIC`. Dla niego zwracamy brak metryk litrowych z powodem
  `UNSUPPORTED_FUEL` oraz ostrzeżenie; nie prezentujemy energii jako litrów. Wsparcie
  kWh wymaga odrębnych reguł i jednostek w module samochodów.
- Lista dostępnych paliw dotyczy dostarczonej historii do końca zakresu. Adapter
  etapu 2 musi jawnie określić kontekst pobrania i ewentualnie dostarczyć pełny katalog
  paliw auta do filtrów; kalkulator nie odgaduje nieprzekazanych danych.
- Ten etap nie udostępnia endpointu ani strony i nie wymaga migracji bazy.

### 2. API analizy auta i cache

- [ ] Dodać repozytorium odczytu analitycznego, adapter Prisma i use case składający
  pełną odpowiedź. Uniknąć zapytań per tankowanie oraz pobierania całej historii bez limitu.
- [ ] Dodać `GET /api/cars/:id/analytics`, walidację parametrów i dokumentację OpenAPI.
  Brak auta: 404; niepoprawne filtry/za szeroki zakres: 400; brak tankowań: 200 z pustym
  zestawem i opisem. Błąd generowania nie udaje pustych danych.
- [ ] Dodać ograniczony cache, współdzielenie trwających odczytów i unieważnienie
  po udanym zapisie paliwa, w tym zabezpieczenie wyścigu zapis–odczyt.
- [ ] Dodać testy use case i cache z atrapą repozytorium i kontrolowanym zegarem:
  hit/miss, TTL, limity/eksmisja, niezależność aut i filtrów, równoległe odczyty,
  błędy, zapis wsteczny i unieważnienie w trakcie obliczeń.
- [ ] Sprawdzić TypeScript, testy oraz OpenAPI. Sprawdzić zapytania z rzeczywistą bazą
  dopiero w dostępnym środowisku; wyraźnie oddzielić to od testów jednostkowych.

**Odbiór:** kolejne żądanie w TTL nie pobiera ponownie paliwa ani nie generuje wykresów;
zapis tankowania wymusza świeże obliczenie przy następnym odczycie. Równoczesne
identyczne żądania wykonują jedną operację odczytu/generowania, a nie po jednej na klienta.

### 3. Osobna strona, integracja i końcowy odbiór

- [ ] Dodać stronę „Analiza auta”, link w samochodzie i powrót do właściwego auta,
  integrację istniejącej nawigacji oraz inicjalizację tylko na nowej stronie.
- [ ] Dodać lokalnie dostarczaną bibliotekę wykresów i wspólny renderer; zasoby wykresów
  ładować dopiero na stronie analizy. Moduł auta nie zna opcji biblioteki.
- [ ] Wyświetlić cztery wykresy, filtry, jednostki, wyjaśnienie porównania i szacunków,
  czas obliczenia, stany ładowania, pustych danych i błędu z możliwością ponowienia.
- [ ] Zapewnić układ mobilny, czytelne etykiety i tekstowy/tabelaryczny dostęp do
  wartości także bez wskazywania punktu myszą. Nie polegać wyłącznie na kolorze.
- [ ] Sprawdzić w przeglądarce żądania: zwykła strona auta i zapis paliwa = zero nowych
  żądań analitycznych; wejście na analizę = jedno; zatwierdzenie filtrów = jedno;
  resize i interakcje z wykresem = zero. Oddzielić żądania analityczne od pobierania
  statycznych zasobów i istniejących żądań nawigacji.
- [ ] Zweryfikować wykresy na danych przykładowych oraz pustym aucie, jednym tankowaniu,
  dolewkach, brakującym przebiegu, różnych paliwach i spóźnionych odpowiedziach API.
- [ ] Uruchomić odpowiednie testy regresji, TypeScript, sprawdzenie JS i `git diff --check`.
  Uzupełnić README o stronę, zasady cache i instrukcję testów/deployu.

**Odbiór:** użytkownik musi świadomie wejść w analizę, aby pobrać wykresy. Dodawanie
tankowania zachowuje dotychczasowy przebieg. Renderer można wykorzystać z przykładowym
zestawem danych niezwiązanym z samochodami.

### Konwencja testów

Nazwy i treść testów po angielsku, sekcje `//Given`, `//When`, `//Then`.
Ścieżki testów odzwierciedlają pliki źródłowe pod `tests/modules/...`.
Kalkulator, generator, cache i use case mają testy jednostkowe, bez uruchamiania bazy.
Testy przeglądarkowe i sprawdzenie rzeczywistego API opisujemy osobno. Zegar i zależności
podmieniamy prostymi atrapami, bez dokładania frameworka DI.

## Pomysły na później

| Wykres / funkcja | Po co | Ograniczenie |
| --- | --- | --- |
| Wydatki na auto miesiąc po miesiącu | Słupki: paliwo + serwis; widać drogie miesiące | To zapisane wydatki, nie pełny koszt posiadania auta |
| Łączne wydatki od zakupu | Rosnąca suma paliwa i wizyt | Zakres zależy od kompletności historii |
| Spalanie według trybu jazdy | Porównanie miasta, trasy i jazdy mieszanej | Średnie ważone dystansem i liczba obserwacji, bez mylącego porównania małych próbek |
| Przejechane kilometry miesięcznie | Intensywność korzystania z auta | Odczyty licznika nie określają dokładnej daty przejazdu; potrzebna jawna reguła przypisania |
| Wydarzenia serwisowe na osi spalania | Oznaczenie np. wymiany oleju/filtrów | Współwystępowanie zmian nie dowodzi wpływu naprawy na spalanie |
| Tankowanie do pełna / dolewka | Wiarygodniejsze rozliczanie spalania między pełnymi tankowaniami | Osobna zmiana modelu i formularza; stare wpisy pozostają „nie wiadomo” |
| Eksport PNG/CSV | Zapis wykresu i danych poza aplikacją | Osobny zakres, bez renderowania plików na każde otwarcie strony |

Najbardziej przydatne rozszerzenie po czterech wykresach: **miesięczne wydatki na paliwo
i serwis**. Korzysta z posiadanych danych i pokazuje więcej niż sam koszt paliwa na 100 km.

## Baza i wdrożenie

Pierwsza wersja nie wymaga nowych tabel ani migracji danych: wykorzystuje istniejące
tankowania, a cache jest nietrwały. Standardowy [deploy](../scripts/deploy.sh) pozostaje
właściwą drogą wdrożenia. Nie trzeba uruchamiać osobnego skryptu przeliczającego historię.
Jeśli podczas implementacji ujawni się konieczna zmiana schematu, opisujemy ją jawnie
w review danego etapu, zamiast dokładać migrację bez uzasadnienia.

## Dziennik realizacji

| Etap | Status | Zmiany / pliki | Walidacja i wynik | Review / uwagi |
| --- | --- | --- | --- | --- |
| Plan | Do review | Ten dokument; usunięty zakończony plan przypomnień | Przegląd aktualnego kodu paliwa, tras i schematu | Do zatwierdzenia założenie porównania z 5 poprzednimi tankowaniami |
| 1 | DONE / Do review | Kontrakt i generator charts, kalkulator car, use case czterech wykresów, 3 pliki testów | 176/176 testów OK (51 nowych); TypeScript i diff check OK | Porównanie z 5 poprzednikami; jawne pominięcia niejednoznacznych dni i danych elektrycznych; stare API bez zmian |
| 2 | Do zrobienia | — | — | — |
| 3 | Do zrobienia | — | — | — |
