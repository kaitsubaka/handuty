# Changelog

Implemented changes, newest first. Pending work belongs in `TODO.md`.

## 2026-11-12 — v2.0.1

### Changed

- Prettier and ESLint format and lint the code; the Amplify build fails on any finding.
- Gitflow branches (`develop`, `feature/*`, `release/*`, `hotfix/*`) and Conventional Commits.
- Effects no longer reset state synchronously: modals reset on show, lists are keyed by what
  they were loaded for, and the session provider lives apart from `useSession`.

- Public sign-up is closed on the deployed demo: Cognito only admits accounts created by the
  owner, `/register` redirects to the login page and the sign-up links are hidden.

### Added

- First sign-in of an account created in Cognito: the login page asks for a new password and
  then sends the user to complete the profile.

## 2026-11-12 — v2.0.0

### Changed

- Back end moved from Express + MongoDB + socket.io to AWS Amplify Gen 2: Cognito (email
  sign-in with verification code), AppSync + DynamoDB, one Lambda (`api`) for every write.
- Front end moved from Create React App to Vite, React 19, React Router 7 and Bootstrap 5,
  keeping the v1 design, illustrations and Spanish/English texts.
- Repository flattened: the app is at the root, the backend in `amplify/`.
- A service's rating is now the average of its clients' ratings; v1 stored a single number.
- A booking's price is the hourly price times its duration; v1 stored the hourly price.
- Prices are shown as Colombian pesos with the locale's separators.

### Added

- Business rules enforced on the server: adults only, one service per category per worker, no
  overlapping bookings, bookings on 30-minute slots of 30–120 minutes, cancel only before the
  start, rate once after the end, chat only between its two participants.
- Personal data (phone, ID number, birth date, address) readable only by its owner.
- Email verification step in the sign-up and a "complete profile" page.
- Booking calendar that disables taken slots and shows the total.
- Appointments for workers, cancel for clients, and live chat through AppSync subscriptions.
- Profile page with contact data edit and the worker's services (add, edit, delete).
- Translated messages for every error a user can cause.
- Workers-per-category chart now draws its bars and is public through guest access.
- 52 tests (business rules, helpers, sign-up and booking flows) and `amplify.yml` for Amplify
  Hosting (Node 22, npm 11).
- Deployed on Amplify Hosting in us-east-1 with an SPA rewrite rule and a USD 1/month budget
  alert.

### Fixed

- First cloud deploy: `package-lock.json` lacked entries bundled inside the Amplify constructs
  (`npm ci` refused it), and the custom mutations `createProfile`, `updateProfile` and
  `deleteService` collided with the generated model mutations; they are now
  `registerProfile`, `editProfile` and `removeService`.
- v1 stored passwords in plain text and compared them in the API; Cognito handles them now.
- v1 controllers queried by the wrong filter (`find(id)`), returned past bookings as
  upcoming (filters without `return`) and referenced a missing `Trabajador` model.
- v1 pages called endpoints that did not exist (`/clientes`, `/trabajadores`), and the session
  context had no `loginUser`/`logout`, so sign-in and sign-out never worked.

### Removed

- The Express API, MongoDB models, socket.io server and Postman collections.
- The CRA service worker (offline mode) and web-vitals reporting.
- The decorative QR icon on appointments.
