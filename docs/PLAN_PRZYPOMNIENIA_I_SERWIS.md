# Historia serwisowa i przypomnienia — plan prac

Data: 2026-10-10. Status: etapy 1–2 zakończone; etap 3 zaimplementowany, do review; kolejne etapy nierozpoczęte.

## Cel i sposób pracy

Oddzielić **co zostało zrobione w aucie** od **kiedy trzeba zrobić coś ponownie**.
Pierwsze zastosowania: olej według przebiegu i akumulator według daty.
Przypomnienie może istnieć bez wpisu serwisowego, a wpis bez przypomnienia.

Każdy numerowany etap poniżej to osobna partia do review. Po jego implementacji
agent aktualizuje ten dokument, zapisuje wyniki weryfikacji i zatrzymuje się.
Użytkownik robi review oraz samodzielnie stage/commit/push. Kolejny etap zaczynamy
po sygnale użytkownika. Jeżeli etap okaże się większy, dzielimy go przed rozszerzeniem zmian.
Nie zmieniamy istniejącej historii Git ani nie usuwamy danych.

Baza działa na serwerze użytkownika. W etapach dotyczących danych przygotowujemy
prosty skrypt i instrukcję do samodzielnego uruchomienia na serwerze; nie wykonujemy
lokalnie operacji na bazie ani nie zakładamy dostępu do bazy serwerowej.

## Co jest teraz w kodzie

- [Schemat bazy](../prisma/schema.prisma): `Car.oilChangeIntervalKm` i
  `ServiceRecord.isOilChange`. Wpis serwisowy ma opis, jedną cenę, datę i przebieg;
  nie ma miejsca wykonania usługi.
- [Encja Car](../src/modules/car/domain/entity/Car.ts): `getRemainingKmToOilChange()`
  wybiera wymianę o najwyższym przebiegu. Bez wymiany przyjmuje przebieg zakupu lub 0.
  Bieżący przebieg to najwyższy znany odczyt z przebiegów, tankowań i serwisów,
  a nie odczyt o najnowszej dacie. Nie przebudowujemy tego mechanizmu przy okazji.
- [Kontroler samochodów](../src/modules/car/interface/CarController.ts): licznik oleju
  jest częścią `/api/cars/:id/stats`, razem ze statystykami paliwa.
- [Kontroler serwisu](../src/modules/car/interface/ServiceController.ts): sam tworzy
  klienta Prisma i bezpośrednio zapisuje/odczytuje dane. Tu potrzebny jest lokalny
  refaktor przy rozszerzeniu informacji o serwisie, bez łączenia jego zapisu z przypomnieniami.
- [Widok](../src/pages/car-log.html) i [JavaScript](../public/js/modules/car-log.js):
  „Ostatnie naprawy”, „Dodaj naprawę”, checkbox oleju i dedykowana karta oleju.
  Ładowanie licznika jest połączone z ładowaniem statystyk paliwa.
- W przeszukanym kodzie aplikacji i schemacie nie znaleziono istniejącego modułu przypomnień.

## Proponowane decyzje

### Nazwy i zakres

- UI: **Historia serwisowa**, **Dodaj wpis serwisowy**, **Przypomnienia**.
  Historia obejmuje naprawy, wymiany i przeglądy.
- Nowy moduł backendowy: `reminders`. „Alert” to informacja o osiągniętym lub
  przekroczonym terminie, nie osobny byt i nie osobny moduł.
- Moduł jest wspólny dla całej aplikacji. Przypomnienie wskazuje moduł przez
  `moduleKey` (np. `car`, `smart-agd`) i opcjonalnie konkretny obiekt przez `resourceId`.
  Para tych pól określa kontekst; samo ID nie wystarcza. `general` oznacza przypomnienie ogólne.
- Daty działają w każdym module. Pierwszym obsługiwanym pomiarem jest przebieg auta;
  kolejny rodzaj pomiaru dodamy dopiero przy konkretnej potrzebie innego modułu.
- Terminy użytkownik podaje ręcznie. Nie ma cykliczności ani automatycznego odnawiania po serwisie.
- Jedno przypomnienie ma jeden warunek: datę **albo** przebieg. „15 000 km lub rok,
  zależnie co pierwsze” zostawiamy na później; na początek mogą to być dwa wpisy.
- Bez crona, push, maili, kolejek i zewnętrznych usług. Stan obliczany przy odczycie.
  Widok odświeża dane po zmianach i powrocie do karty; nie obiecuje powiadomień przy zamkniętej stronie.

### Historia serwisowa

Zostaje obecny `ServiceRecord` i adres API `/api/cars/:id/services`.
Jeden wpis to swobodny, również dłuższy i wielowierszowy tekst o tym, co zrobiono
za jednym razem u mechanika, cena, data i przebieg. Nie modelujemy listy czynności.
Dodajemy opcjonalne tekstowe `workshopName` i `workshopAddress`.
Nie tworzymy katalogu warsztatów ani osobnych kosztów każdej czynności.

Zapis serwisu nie tworzy, nie wykonuje i nie zmienia przypomnień. Użytkownik osobno
podaje przypomnienie lub edytuje jego termin. Nie rozpoznajemy wymiany oleju po opisie
i nie dodajemy kolejnych checkboxów typu `isBatteryChange` do historii.

### Model przypomnienia — propozycja kontraktu

| Pole | Znaczenie |
| --- | --- |
| `id`, `title` | Tożsamość i własny opis, np. „Wymiana oleju” |
| `moduleKey` | Kontekst modułu, np. `car`, `smart-agd`, albo `general` |
| `resourceId?` | ID obiektu w tym module, np. konkretnego auta; wymagane dla przebiegu |
| `additionalInfo?` | Opcjonalny swobodny tekst „Dodatkowe informacje”, również wielowierszowy |
| `kind` | `DATE` albo `MILEAGE` |
| `dueDate?` | Docelowy dzień `YYYY-MM-DD`, wyłącznie dla daty |
| `dueMileageKm?` | Docelowy stan licznika, wyłącznie dla przebiegu |
| `lifecycle` | `ACTIVE`, `COMPLETED`, `ARCHIVED` |
| `createdAt`, `updatedAt` | Daty techniczne |

Przechowujemy konkretny termin, nie malejącą liczbę „pozostało”. Formularz może przyjąć
„za 4 dni” lub „za 10 000 km”; backend przelicza to względem jawnej daty/przebiegu bazowego.
Dokładne nazwy pól Prisma i reprezentację daty ustalamy w etapie 3, zachowując te reguły.
Nie wprowadzamy dowolnego JSON-a z warunkami. Kontekst modułu jest ogólny, bez kolumny `carId`
w przypomnieniu i bez zależności od historii serwisowej.

`additionalInfo` służy wyłącznie do wyświetlania. Dla auta może brzmieć
„Ostatnia wymiana przy 180 000 km, olej 5W-30”, a dla urządzenia
„Filtr pod zlewem, wkład kupiony w maju”. Front wyświetla tekst tak samo w każdym module,
z zachowaniem nowych linii. Nie analizuje go i nie wyciąga z niego przebiegu do obliczeń.
Wartości potrzebne do liczenia pozostają w osobnych polach i źródłach danych.

Backend zwraca wyliczone `remaining: { value, unit }`, `status` oraz podstawę obliczenia
(przebieg i datę odczytu albo dzień obliczenia). Przykładowy fragment odpowiedzi:

```json
{
  "title": "Wymiana oleju",
  "moduleKey": "car",
  "resourceId": "przykladowe-id-auta",
  "additionalInfo": "Ostatnia wymiana przy 180 000 km, olej 5W-30",
  "kind": "MILEAGE",
  "dueMileageKm": 190000,
  "status": "UPCOMING",
  "remaining": { "value": 4000, "unit": "KM" },
  "currentMileageKm": 186000
}
```

Frontend formatuje „za 4 000 km”, „za 4 dni”, „dzisiaj”, „osiągnięty przebieg”
lub „przekroczono o 500 km / 2 dni”. Nie zna specjalnej reguły dla oleju.

### Reguły obliczeń i ręcznej obsługi

- `remaining = termin - aktualna wartość`: dodatnie → `UPCOMING`, zero → `DUE`,
  ujemne → `OVERDUE`. Nie obcinamy wyniku do zera. Brak wymaganej podstawy →
  `UNKNOWN` i `remaining: null`, nigdy fikcyjne „0 km”.
- Dni liczymy kalendarzowo w `Europe/Warsaw`, bez dzielenia milisekund przez 24 godziny.
  Data docelowa pozostaje dniem kalendarzowym, niezależnie od strefy przeglądarki i DST.
- Akumulator: użytkownik podaje konkretną datę, np. 2030-10-10. Ewentualną datę
  ostatniej wymiany i uwagi wpisuje w dodatkowych informacjach.
- Przebieg korzysta z obecnego źródła w module `car`; jeśli istnieje tylko wiarygodny
  przebieg zakupu, można użyć go z oznaczeniem podstawy. Bez danych pokazujemy brak danych.
  Licznik oznacza stan według ostatnich zapisów, nie bieżącą telemetrię auta.
- Oznaczenie wykonania ustawia `COMPLETED` i nie wyznacza kolejnego terminu.
  Użytkownik sam tworzy następne przypomnienie lub ręcznie zmienia termin i status istniejącego.
  Nie wymagamy przy tym fikcyjnego serwisu ani podawania przebiegu wykonania.
- Zapis historycznej wizyty nie zmienia docelowego terminu. Jej przebieg może wpłynąć
  na obecne źródło odczytów auta, a przez to na pozostałą odległość, jak każdy zapis przebiegu.
- Nie planujemy edycji/usuwania historii serwisowej w tym zakresie. Archiwizacja
  przypomnienia nie usuwa serwisów. Nieaktywne auto: odczyt historii i przypomnień,
  bez dodawania przypomnień i zmiany terminów przez API i UI.

### Granice modułów i API

- `reminders`: kontrakty, obliczenia, cykl życia, repozytorium i adapter Prisma.
- `car`: historia serwisowa i źródło przebiegu. Adapter dostarcza przebieg przez mały
  kontrakt wymagany przez przypomnienia; domena przypomnień nie importuje encji `Car`.
- Właściciel kontekstu sprawdza istnienie obiektu i dostarcza odczyt, jeśli jest potrzebny.
  Proste adaptery składamy ręcznie, bez systemu pluginów. Dodanie obsługi dat dla następnego
  modułu nie wymaga zmiany tabeli przypomnień. Nie dodajemy obecnie UI w innych modułach.
- Powiązanie `moduleKey` + `resourceId` nie ma jednego klucza obcego w bazie: istnienie
  sprawdzamy w aplikacji. Nieznany moduł/niewspierany pomiar jest błędem walidacji.
  Usunięty obiekt nie powoduje przypisania wpisu gdzie indziej; pokazujemy brak kontekstu,
  a dla pomiaru `UNKNOWN`. Historia przypomnienia pozostaje do archiwizacji.
- Kontrolery obsługują HTTP, use case'y zachowanie. Zależności składamy ręcznie
  w [src/index.ts](../src/index.ts), zgodnie z projektem.
- Proponowane API: `GET/POST /api/reminders`, `PATCH /api/reminders/:id`,
  `POST /api/reminders/:id/complete`; lista z filtrami `moduleKey`, `resourceId` i cyklu życia.
  Sekcja konkretnego auta pobiera `/api/reminders?moduleKey=car&resourceId=<id>`.
  Filtr `resourceId` wymaga `moduleKey`, aby nie mieszać ID różnych modułów.
  Archiwizacja przez `PATCH`, bez fizycznego usuwania w MVP.
- Walidacja: niepusty tytuł, poprawna data, skończone nieujemne przebiegi,
  zgodność pomiaru z modułem, wykluczające się terminy, istniejący obiekt oraz
  tekstowe dodatkowe informacje z jawnym limitem długości. Błędy danych → 400,
  brak zasobu → 404. Ponowienie oznaczenia wykonania nie ma dodatkowych skutków.
  Uzupełniamy OpenAPI. Zapis serwisu i przypomnienia to niezależne operacje.

## Etapy do realizacji i review

### DONE 1. Nazwy w interfejsie

- [x] Zamienić teksty „naprawy” na „historię/wpisy serwisowe”, także komunikaty formularza i błędów.
- [x] Zachować obecne API, bazę i zachowanie licznika oleju (zmieniono wyłącznie teksty i komentarze).
- [x] Sprawdzić składnię zmienionego JS: `node --check public/js/modules/car-log.js` — OK.
- [x] Przejrzeć diff i uruchomić `git diff --check` — bez błędów whitespace.
- [ ] Odbiór ręczny na działającej aplikacji: widok pusty, lista i formularz — do review użytkownika;
  nie uruchamiano aplikacji ani nie wykonywano zapisu na serwerze.

**Gotowe, gdy:** użytkownik widzi spójne nazwy, dodawanie działa jak wcześniej.
Zakres: obecny HTML i JS strony auta. DONE oznacza zakończenie implementacji;
odbiór w działającej aplikacji i akceptacja pozostają do wykonania.

### DONE 2. Lokalny refaktor zapisu i odczytu serwisów

- [x] Wprowadzić kontrakt repozytorium serwisów i use case'y dodawania/listowania.
- [x] Przenieść Prisma z kontrolera do adaptera, wstrzyknąć zależności w composition root.
- [x] Zachować obecne DTO, odpowiedzi i obsługę `isOilChange`; bez refaktoru paliwa i całego `CarController`.
- [x] Uruchomić `npx.cmd tsc --noEmit` — OK (PowerShell blokuje wrapper `npx.ps1`).
- [x] Uruchomić `node -r ts-node/register --test tests/modules/car/interface/ServiceController.test.cjs` — 3/3 testy OK:
  dodawanie/lista, 404 bez zapisu, pusta lista dla brakującego auta, flaga oleju, ujemny koszt i licznik oleju.
- [x] Przejrzeć diff i uruchomić `git diff --check` — OK.
- [ ] Odbiór na serwerze użytkownika: rzeczywisty zapis i odczyt Prisma. Testy lokalne korzystają
  z atrap repozytoriów; nie uruchamiano aplikacji ani połączenia z bazą. Schemat bazy nie zmienia się.

**Gotowe, gdy:** kontroler nie zawiera zapisu Prisma, a publiczne zachowanie pozostaje zgodne.

### DONE 3. Model przypomnień i obliczenia

- [x] Dodać minimalny moduł `reminders`, model Prisma i addytywną migrację.
- [x] Uwzględnić `moduleKey`, `resourceId`, `additionalInfo` i ręcznie podany termin.
- [x] Zaimplementować obliczenia km/dni, bez cykliczności.
- [x] Przygotować testy reguł: dodatnie/zero/ujemne, brak przebiegu, DST, 29 lutego,
  koniec miesiąca i niepoprawne rodzaje warunków.
- [x] Uruchomić testy, `npx.cmd tsc --noEmit`, `npx.cmd prisma validate`; obejrzeć SQL migracji — OK.
- [x] Przygotować [skrypt serwerowy](../scripts/migrate-reminders.sh) i instrukcję poniżej.
- [ ] Uruchomienie migracji na serwerze i sprawdzenie bazy — pozostaje użytkownikowi.

**Gotowe, gdy:** reguły działają niezależnie od HTTP, migracja niczego nie usuwa.
Testy korzystają z `node:test` i istniejącego `ts-node`; nie dodano zależności.
Po review dodano `npm test`, automatycznie wykrywające testy w podkatalogach.
Katalog `tests/modules/...` odwzorowuje `src/modules/...`, a nazwa pliku wskazuje
testowaną klasę. Instrukcja lokalna i Docker znajduje się w [README](../readme.md).
Po przeniesieniu plików `npm.cmd test` — 52/52 OK.

**Wyniki:** `node -r ts-node/register --test tests/modules/reminders/domain/Reminder.test.cjs tests/modules/car/interface/ServiceController.test.cjs`
— 52/52 OK (49 nowych jednostkowych + 3 regresji serwisu). Nowe testy mają sekcje
`//Given`, `//When`, `//Then`, w tym asercje wyjątków. Testują wyłącznie domenę:
bez mockowania bazy, HTTP, sieci i rzeczywistego zegara. Czas jest argumentem obliczenia.
TypeScript i Prisma validate — OK; walidacja Prisma wymagała uruchomienia poza sandboxem
z powodu blokady dostępu do katalogu tymczasowego, bez wykonywania migracji.

**Ustalone szczegóły modelu:** tytuł do 200 znaków, dodatkowe informacje do 5000 znaków,
identyfikator modułu do 64 znaków i obiektu do 200. Docelowy przebieg jest nieujemną
liczbą całkowitą mieszczącą się w Prisma `Int`; odczyt może być ułamkowy (jak obecne tankowania).
Data w domenie to `YYYY-MM-DD`, w PostgreSQL `DATE` (`DateTime @db.Date` w Prisma).
Przyszły adapter zamieni ją na/z daty UTC o północy, nie lokalnej północy serwera.
Różnicę dni liczymy z numerów dni kalendarzowych po ustaleniu dzisiejszej daty w Warszawie,
a nie z czasu trwania między lokalnymi północami. Wykonane/archiwalne przypomnienia
zwracają swój status i `remaining: null`. Rejestr obsługiwanych modułów, sprawdzanie
istnienia obiektu oraz źródło przebiegu należą do etapu 4; domena sprawdza format kontekstu.
Formularz względnego terminu „za...” pozostaje do obsłużenia w późniejszych etapach;
obecny model przyjmuje konkretny termin, zgodnie z założeniem przechowywania daty/przebiegu docelowego.

**Standardowy deploy:** użytkownik uruchamia [deploy.sh](../scripts/deploy.sh), który
już wykonuje `npm run migrate:deploy` przed startem kontenerów. Nie trzeba po nim
wykonywać dodatkowego skryptu migracji. Testy uruchamiamy osobno:
`docker compose exec api npm test` (deploy ich automatycznie nie uruchamia).

**Opcjonalne uruchomienie migracji bez pełnego deployu:** przesłać aktualne pliki projektu i z katalogu
repozytorium wykonać `sh scripts/migrate-reminders.sh`. Skrypt wymaga działającego kontenera
`api` z aktualnymi plikami (obecny Compose montuje repozytorium) i jego konfiguracją bazy.
Wykonuje `npm run migrate:deploy`, następnie `npm run prisma:generate` wewnątrz kontenera.
Stosuje **wszystkie oczekujące migracje** w tej wersji repozytorium, nie tylko przypomnienia;
przed uruchomieniem przejrzeć ich zakres. Nie robi pull, restartu, resetu ani usuwania danych.
Ponowne uruchomienie korzysta z historii migracji Prisma. Nie uruchamiać SQL ręcznie obok
tego skryptu, aby zachować spójny rejestr migracji. Skrypt przejrzano statycznie;
nie testowano jego wykonania na serwerze. Ten etap nie zmienia jeszcze UI ani API.

### 4. API samodzielnych przypomnień

- [ ] Dodać repozytorium, use case'y, kontroler i trasy tworzenia/listy/edycji/archiwizacji/wykonania.
- [ ] Podłączyć źródło przebiegu z `car`, walidację oraz OpenAPI.
- [ ] Sprawdzić przypomnienie ogólne na dzień, olej na wskazany przebieg i akumulator na datę.
- [ ] Sprawdzić izolację modułów i obiektów (także jednakowe ID w różnych modułach),
  nieaktywne auto, błędne dane i ponowienie wykonania. Drugi kontekst można sprawdzić adapterem testowym.
- [ ] Sprawdzić zapis/edycję/odczyt dodatkowych informacji i brak wymogu serwisu.
- [ ] Uruchomić `npx tsc --noEmit` i testy dotkniętych reguł/API.

**Gotowe, gdy:** przypomnienie działa bez wpisu serwisowego i zwraca jednostkę, pozostałą wartość i status.

### 5. Opis wizyty i miejsce serwisu

- [ ] Dodać opcjonalny warsztat/adres do serwisu (model, migracja, DTO, odczyt i zapis).
- [ ] Zmienić pole opisu na wielowierszowe; wyświetlać dłuższy tekst i nowe linie bez HTML użytkownika.
- [ ] Zachować prosty zapis opisu, ceny, daty i przebiegu; dodać pola miejsca w formularzu i historii.
- [ ] Zweryfikować zapis dłuższego opisu, brak miejsca i podane miejsce; zapis nie tworzy przypomnienia.
- [ ] Uruchomić `npx tsc --noEmit`, `npx prisma validate` i odpowiednie testy integracyjne.

**Gotowe, gdy:** można zapisać opis całej wizyty, cenę i opcjonalne miejsce, niezależnie od przypomnień.

### 6. Przeniesienie istniejących ustawień oleju

- [ ] Przygotować jawnie uruchamianą konwersję z trybem podglądu, poza startem serwera i odczytem API.
- [ ] Dla auta z dodatnim starym interwałem i zapisaną wymianą zaproponować jednorazowy
  termin (przebieg wymiany + dawny interwał), z kontekstem `car` i ID auta.
  To jednorazowy import do zatwierdzenia/poprawienia, nie reguła cykliczna.
  Zachować dotychczasowy wybór według najwyższego przebiegu, rozbieżności dat raportować.
- [ ] Dla auta bez zapisanej wymiany raportować potrzebę wskazania podstawy; nie traktować
  automatycznie zakupu auta jako wymiany oleju i nie tworzyć terminu od zera.
- [ ] Zapewnić trwałe oznaczenie pochodzenia i unikalność konwersji dla auta; ponowne
  uruchomienie nie duplikuje wpisu ani nie nadpisuje późniejszych zmian użytkownika.
- [ ] Sprawdzić podgląd i konwersję na danych testowych, zachowanie historii i ponowne uruchomienie.

**Gotowe, gdy:** jest raport utworzonych/pominiętych/problemowych pozycji i sposób bezpiecznego uruchomienia.
Przed konwersją rzeczywistych danych użytkownik wykonuje kopię zapasową i przegląda podgląd.
Stare pola i licznik nadal istnieją do przełączenia UI; nie dopuszczamy długiego równoległego
używania dwóch źródeł ustawień. Przed przełączeniem ponownie uzgadniamy nowe serwisy od czasu podglądu.

### 7. Interfejs przypomnień w sekcji auta

- [ ] Dodać niezależnie ładowaną sekcję przypomnień; awaria statystyk paliwa jej nie blokuje.
- [ ] Dodać formularz ręcznego terminu i dodatkowych informacji oraz edycję, wykonanie i archiwizację.
- [ ] Kontekst modułu i auta ustawiać z otwartego widoku, bez ręcznego wpisywania ID.
- [ ] Wyświetlać dodatkowe informacje jako zwykły tekst pod przypomnieniem, również wielowierszowy.
- [ ] Zastąpić kartę oleju wspólną prezentacją przypomnień. Nie przełączać do czasu
  uzgodnienia danych z etapu 6. Pokazać brak danych i przekroczenie terminu czytelnym tekstem.
- [ ] Renderować własne teksty użytkownika bez wstrzykiwania HTML; odświeżać po zapisie
  i powrocie do karty. Obsłużyć błędy, pustą listę i auto nieaktywne.
- [ ] Sprawdzić składnię JS i ręcznie scenariusze na szerokim/wąskim ekranie.

**Gotowe, gdy:** cały przepływ działa z UI, a olej nie ma oddzielnych reguł frontendowych.
W razie potrzeby oddzielić odczyt listy od formularzy, z osobnym review każdej części
i pozostawieniem starej karty do zakończenia przełączenia.

### 8. Wyłączenie starej logiki oleju

- [ ] Po sprawdzeniu konwersji i UI usunąć zależność aplikacji od `isOilChange`,
  `oilChangeIntervalKm`, starej metody w `Car` i odpowiedzi `stats.oilChange`.
- [ ] Przejrzeć mappery, DTO, OpenAPI i wszystkie użycia, sprawdzić statystyki paliwa.
- [ ] Stare kolumny pozostawić na razie w bazie jako dane historyczne. Ich fizyczne
  usunięcie to osobna przyszła decyzja, poza tym planem.
- [ ] Uruchomić `npx tsc --noEmit`, odpowiednie testy i przejść pełne scenariusze odbioru.

**Gotowe, gdy:** nowe przypomnienia są jedynym aktywnym źródłem terminów, historia i ceny pozostają zachowane.

## Scenariusze końcowego odbioru

1. Serwis: dłuższy opis wizyty (olej, tuleje, sworzeń), cena i adres warsztatu.
   Historia pokazuje wpis, zapis nie tworzy ani nie przesuwa przypomnienia.
2. Ręcznie podany termin oleju 190 000 km, aktualny przebieg 186 000 km:
   „za 4 000 km”; przy 190 000 km termin osiągnięty; przy 190 500 km przekroczony o 500 km.
3. Akumulator: ręcznie podany termin 2030-10-10; cztery dni wcześniej
   „za 4 dni”, w terminie „dzisiaj”, potem informacja o przekroczeniu.
4. Dowolne przypomnienie „za 4 dni” bez auta i bez serwisu działa tym samym mechanizmem.
5. Wykonanie przypomnienia zamyka je bez nowego terminu; kolejny użytkownik podaje sam.
6. Przypomnienia różnych modułów z takim samym ID obiektu nie mieszają się na listach.
   Dodatkowe informacje o przebiegu auta i o filtrze urządzenia są niezależnymi tekstami;
   ich zmiana nie zmienia obliczeń ani terminu.
7. Brak danych nie daje fałszywego licznika. Zapis paliwa/przebiegu aktualizuje wynik przy odczycie.
8. Migracja zachowuje istniejące opisy, ceny, daty i przebiegi; przypadki niejednoznaczne są raportowane.

## Poza obecnym zakresem

Automatyczne odnawianie, interwały cykliczne, powiązanie zapisu serwisu z przypomnieniami,
powiadomienia poza aplikacją, ogólny silnik automatyzacji, dowolne jednostki/czujniki,
warunki łączone, kosztorys pozycji serwisowych, katalog warsztatów, przebudowa statystyk
paliwa, nowe frameworki i ogólny refaktor modułu samochodów.

## Dziennik realizacji

Statusy: **do zrobienia → w toku → do review → zaakceptowane**. Zaznaczenie zadań
oznacza wykonanie, nie akceptację użytkownika. Po review zapisujemy również ustalone poprawki.

| Etap | Status | Zmiany / pliki | Walidacja i wynik | Review / uwagi |
| --- | --- | --- | --- | --- |
| Plan | Do review | Ten dokument | Sprawdzenie zgodności z obecnym kodem i linków lokalnych | Po uwagach użytkownika: kontekst dowolnego modułu, dodatkowe informacje jako tekst, ręczne terminy i niezależny opis wizyty; bez odnawiania |
| 1 | DONE / Do review | [Widok auta](../src/pages/car-log.html), [JS auta](../public/js/modules/car-log.js): nagłówki, przycisk, komunikaty ładowania, pustej listy i błędów; aktualizacja tego planu | `node --check public/js/modules/car-log.js` i `git diff --check` — OK; przegląd diffu | Test ręczny na działającej aplikacji pozostaje użytkownikowi; bez zmian API/bazy/licznika oleju |
| 2 | DONE / Do review | [Kontrakt](../src/modules/car/domain/repository/ServiceRecordRepository.ts), [dodawanie](../src/modules/car/application/CreateServiceRecordUseCase.ts), [listowanie](../src/modules/car/application/ListServiceRecordsUseCase.ts), [adapter Prisma](../src/modules/car/infrastructure/ServiceRecordRepositoryPrisma.ts), [kontroler](../src/modules/car/interface/ServiceController.ts), [composition root](../src/index.ts), [testy](../tests/modules/car/interface/ServiceController.test.cjs), ten plan | TypeScript — OK; 3/3 testy bez bazy — OK; diff check — OK | Zachowane API i zapytania Prisma; rzeczywisty zapis/odczyt do sprawdzenia na serwerze |
| 3 | DONE / Do review | [Domena](../src/modules/reminders/domain/Reminder.ts), [schemat](../prisma/schema.prisma), [migracja](../prisma/migrations/20261010180000_add_reminders/migration.sql), [skrypt](../scripts/migrate-reminders.sh), [testy jednostkowe](../tests/modules/reminders/domain/Reminder.test.cjs), ten plan | 49/49 nowych testów i 3/3 regresji OK; TypeScript, Prisma validate i diff check OK | Baza nietknięta; migracja i skrypt do uruchomienia na serwerze; API w etapie 4 |
| 4 | Do zrobienia | — | — | — |
| 5 | Do zrobienia | — | — | — |
| 6 | Do zrobienia | — | — | — |
| 7 | Do zrobienia | — | — | — |
| 8 | Do zrobienia | — | — | — |
