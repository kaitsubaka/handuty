# TASKS — Handuty

Task history. Open work that is not a numbered task lives in `TODO.md`; implemented changes are
described in `CHANGELOG.md`.

Legend: `[ ]` pending · `[~]` in progress · `[x]` done · `[!]` blocked or with a note

## v2.0 — Amplify Gen 2 migration

### Phase 0 — Documentation

- [x] 0.1 `SPECS.md`: goal, decisions, use cases, business rules, data model, API, Free Tier guardrails
- [x] 0.2 `ARCHITECTURE.md`, `CODESTYLE.md`, `TASKS.md`, `TODO.md`, `CHANGELOG.md`, `CLAUDE.md`, `README.md`

### Phase 1 — Repository

- [x] 1.1 Branch `amplify-gen2`; Vite app at the root, `front/` flattened, `back/` (Express, Mongo, socket.io) removed
- [x] 1.2 Assets, locales and CSS renamed to English paths; v1 pages under `Old/`, service worker and CRA files removed
- [x] 1.3 `amplify.yml` for Amplify Hosting (pipeline-deploy, tests, build)

### Phase 2 — Backend

- [x] 2.1 Auth: Cognito email sign-in with verification code
- [x] 2.2 Data: `Profile`, `PrivateProfile`, `Service`, `Booking`, `Chat`, `Message`, indexes and read-only owner rules
- [x] 2.3 `api` Lambda: 9 mutations + `busySlots`, rules in `rules.ts`
- [x] 2.4 Unit tests for every rule (37)
- [x] 2.5 `tsc` clean except the `$amplify/env/api` module generated at deploy time

### Phase 3 — Front end

- [x] 3.1 Vite + React 19 + Router 7 + Bootstrap 5 + react-intl; Amplify configured from `amplify_outputs.json`
- [x] 3.2 Session context and route guards; sign-up in 3 steps with email code; complete-profile page
- [x] 3.3 Landing with the workers-per-category chart (guest access)
- [x] 3.4 Home dashboards (client and worker): next bookings carousel, last message, services
- [x] 3.5 Services, search with autocomplete, results with price filter and sorting
- [x] 3.6 Booking with busy slots disabled and live total
- [x] 3.7 Appointments: upcoming/past, cancel, rate
- [x] 3.8 Messenger with live updates
- [x] 3.9 Profile: private data, contact edit, worker services CRUD
- [x] 3.10 Translations for every new text and every backend error code (es/en)
- [x] 3.11 Component tests (Register, Book) and helper tests; 52 tests green; production build green

### Phase 4 — Cloud

- [x] 4.1 First cloud deploy through Amplify Hosting (us-east-1, now branch `develop`); the
      local sandbox is optional and still needs AWS credentials on the machine (`TODO.md`)
- [ ] 4.2 End-to-end check in the browser against the deployed app (both roles, chat between
      two browsers)
- [x] 4.3 Amplify Hosting app connected to the GitHub branch, SPA rewrite rule, Budgets alert
      (USD 1/month)
- [ ] 4.4 Demo accounts (`scripts/create-demo-users.sh`) created in the `develop` user pool and
      their profiles completed (Worker and Customer)
