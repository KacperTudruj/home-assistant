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