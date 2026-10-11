# 🏠 Tudruj Home Assistant

Hobbystyczny projekt typu **Home Assistant / domowy system**, tworzony jako plac zabaw
backendowy, architektoniczny i narracyjny.

Projekt nie jest produktem komercyjnym – to **eksperyment, nauka i frajda z budowania**.

---

## 🧠 Idea projektu

- Domowy system webowy działający w **LAN**
- Modularna architektura (feature-based)
- Backend steruje narracją i logiką
- Frontend jest prosty i „głupi”
- System posiada **komentatorów**, którzy komentują działania użytkownika

Projekt jest rozwijany **bez presji**, bez „enterprise overengineering”.

---

## 🧱 Stack technologiczny

### Backend
- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Docker + Docker Compose

### Frontend
- HTML
- CSS
- Vanilla JavaScript
- Brak frameworków (świadoma decyzja)

---

## 📚 Dokumentacja

- [Integracja Zigbee (Lokalna)](docs/ZIGBEE_LOCAL_INTEGRATION.md) — Przewodnik konfiguracji Zigbee2MQTT oraz integracji z backendem.

## Testy

Testy korzystają z `node:test` i `ts-node`. Po zainstalowaniu zależności uruchom
z katalogu projektu wszystkie testy (również w podkatalogach):

```bash
npm test
```

W PowerShell, jeśli polityka blokuje `npm.ps1`, użyj `npm.cmd test`.
Na serwerze, po deployu, w działającym kontenerze:

```bash
docker compose exec api npm test
```

Pojedynczy plik, np. testy jednostkowe przypomnień:

```bash
node -r ts-node/register --test tests/modules/reminders/domain/Reminder.test.cjs
```

Ten sam plik w kontenerze:

```bash
docker compose exec api node -r ts-node/register --test tests/modules/reminders/domain/Reminder.test.cjs
```

Obecne testy nie łączą się z bazą ani siecią; nie wymagają migracji. Testy
[Reminder](tests/modules/reminders/domain/Reminder.test.cjs) sprawdzają samą domenę,
a [ServiceController](tests/modules/car/interface/ServiceController.test.cjs) współpracę
kontrolera z use case'ami na atrapach repozytoriów.

Katalog [tests](tests/) odwzorowuje strukturę [src](src/), np.
[src/modules/reminders/domain/Reminder.ts](src/modules/reminders/domain/Reminder.ts)
→ [tests/modules/reminders/domain/Reminder.test.cjs](tests/modules/reminders/domain/Reminder.test.cjs).
To konwencja projektu, nie wymóg Node. Pliki nazywamy `NazwaKlasy.test.cjs`.
Nowe testy zapisujemy w sekcjach `//Given` (dane), `//When` (wywołanie),
`//Then` (asercje, także oczekiwane wyjątki).

### Deploy i migracje

Po wdrożeniu przypomnień wykonaj standardowo:

```bash
bash scripts/deploy.sh
docker compose exec api npm test
```

Migracja automatycznie przenosi stare ustawienia oleju do przypomnień, gdy istnieje
zapisana wymiana i poprawny interwał. Zachowuje historię serwisów. Import pomija auta
bez wymiany, z niepoprawnymi danymi lub istniejącym aktywnym przypomnieniem kilometrowym.
Po deployu przejrzyj sekcję „Przypomnienia” każdego auta i ustaw brakujące terminy ręcznie.
Importowane przypomnienia nie odnawiają się automatycznie; nieaktywne auta dostają wpisy archiwalne.
Historia migracji Prisma zapobiega ponownemu importowi przy następnym deployu.
Kolejna migracja zamienia dawną flagę wymiany oleju na etykietę `OIL_CHANGE`, usuwa
flagę i tymczasową tabelę raportu importu. Nie usuwa przypomnień ani wizyt.
Dotychczasowy skrypt raportu został usunięty; nie trzeba go uruchamiać.

### Etykiety serwisu

Wpis może mieć jedną etykietę lub żadnej: wymiana oleju, filtry, akumulator, przegląd,
naprawa. Etykieta opisuje wizytę i nie tworzy ani nie odnawia przypomnień.
Formularz pobiera opcje z `GET /api/cars/service-labels`.
Aby dodać kolejną, rozszerz enum `ServiceLabel` w [schemacie](prisma/schema.prisma),
listę [SERVICE_LABELS](src/modules/car/domain/value-object/ServiceLabel.ts), nazwy w
[ServiceLabelOptions](src/modules/car/interface/dto/ServiceLabelOptions.ts) oraz OpenAPI;
przygotuj migrację enumu. Frontend wyświetli nową opcję bez dopisywania własnej mapy.

[scripts/deploy.sh](scripts/deploy.sh) wykonuje `npm run migrate:deploy` przed
uruchomieniem kontenerów. Standardowy deploy stosuje więc oczekujące migracje;
dodatkowy [skrypt migracji przypomnień](scripts/migrate-reminders.sh) nie jest wtedy
potrzebny. Samo `docker compose up -d` nie wykonuje migracji. Deploy nie uruchamia
testów automatycznie — uruchom je osobno powyższą komendą.

---

## 🧩 Architektura backendu

Backend jest podzielony modułowo, inspirowany Clean / Hexagonal Architecture,
ale bez dogmatów.

### Struktura modułu (przykład: `commentary`)

modules/
└─ commentary/
├─ application/ # use cases (logika aplikacyjna)
├─ domain/ # interfejsy, kontrakty, encje
├─ infrastructure/ # Prisma / DB
├─ interface/ # kontrolery HTTP (Express)


### Zasady
- Controller → tylko HTTP (req / res)
- UseCase → logika biznesowa
- Repository (interface) → kontrakt
- RepositoryPrisma → implementacja DB
- Composition Root → `index.ts` (ręczne składanie zależności)

Brak frameworków DI – wszystko jawnie.

---
