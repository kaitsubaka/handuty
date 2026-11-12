# ARCHITECTURE — Handuty

How the code is built. It reflects the implemented code; the what and why are in `SPECS.md`,
pending work in `TODO.md`, implemented changes in `CHANGELOG.md`.

## 1. Runtime

```
 Browser (React SPA, Vite build)                         AWS (one Amplify Gen 2 app)
 ┌─────────────────────────────────┐   SRP sign-in   ┌───────────────────────────────┐
 │ aws-amplify/auth ───────────────┼────────────────►│ Cognito User Pool (email)     │
 │                                 │                 │ Cognito Identity Pool (guest) │
 │ aws-amplify/data                │                 └───────────────────────────────┘
 │  reads: models.*.get/list/index ├──── GraphQL ───►┌───────────────────────────────┐
 │  writes: mutations.*            │   (user pool    │ AppSync API                   │
 │  live: Message.onCreate (ws)    │◄── or IAM) ─────┤  model resolvers ──► DynamoDB │
 └─────────────────────────────────┘                 │  custom ops ──► Lambda `api` ─┤
                                                     │        ▲           (IAM)      │
                                                     │        └── models.* via IAM ◄─┘
                                                     └───────────────────────────────┘
```

- **Reads** go straight from the browser to AppSync with the user pool token; owner rules on
  each model decide which records come back (SPECS §5).
- **Writes** are custom mutations resolved by the `api` Lambda. It checks the business rules
  (`rules.ts`), then writes through AppSync with IAM (`allow.resource(api)`), so model
  subscriptions still fire for the readers.
- **Chat** is live through the `Message.onCreate` subscription, filtered by `chatId`; AppSync
  filters subscription events by the same owner rule (`participants`), to be confirmed on the
  first deploy (`TODO.md`).
- **Landing chart**: visitors read `Service` through the Identity Pool guest role
  (`guestClient`), signed-in users through the user pool (`client`).

## 2. Repository layout

```
amplify/                    Amplify Gen 2 backend (TypeScript, its own tsconfig)
  backend.ts                defineBackend({ auth, data, api })
  auth/resource.ts          email sign-in, verification email text
  data/resource.ts          schema: enums, 6 models, 1 custom type, custom query + mutations
  functions/api/
    resource.ts             defineFunction (Node 22, arm64, 512 MB, 10 s, logs 1 week, data stack)
    handler.ts              routes event.info.fieldName to a resolver, data client with IAM
    rules.ts                pure business rules, RuleError codes (unit tested)
src/                        React app (JSX)
  main.jsx                  Amplify.configure, IntlProvider, Router, SessionProvider
  App.jsx                   routes, lazy pages, RequireSession guards
  context/Session.jsx       auth + profile state machine, Hub listener
  lib/                      amplify clients, api helpers, queries, dates, validation, locale
  components/               layout, sidebar, modals, search, chart, chat pieces, sign-up steps
  pages/                    one file per route, with its CSS
  constants/                categories, roles, navigation
  locales/                  es.json, en.json (same keys, enforced by a test)
  assets/                   illustrations and icons of v1
tests/                      vitest: rules (node), api helpers, Login, Register and Book (jsdom)
amplify.yml                 Amplify Hosting build: backend pipeline-deploy, tests, Vite build
```

## 3. Data schema (`amplify/data/resource.ts`)

| Model | Identifier | Secondary indexes (query field) | Read rule |
|---|---|---|---|
| `Profile` | `userId` | – | `authenticated` |
| `PrivateProfile` | `userId` | – | `ownerDefinedIn('userId').identityClaim('sub')` |
| `Service` | `id` | `workerId` (`servicesByWorker`), `category` (`servicesByCategory`) | `authenticated`, `guest` |
| `Booking` | `id` | `clientId`+`startAt` (`bookingsByClient`), `workerId`+`startAt` (`bookingsByWorker`), `serviceId`+`startAt` (`bookingsByService`) | owner in `clientId`, owner in `workerId` |
| `Chat` | `id` = `<clientId>_<workerId>` | `clientId`+`lastMessageAt`, `workerId`+`lastMessageAt` | owners in `participants` |
| `Message` | `id` | `chatId`+`sentAt` (`messagesByChat`) | owners in `participants` |

- Every rule is `.to(['read'])`; the schema-level `allow.resource(api)` is the only writer.
- Subscriptions are disabled on every model except `Chat` and `Message`.
- `Chat.lastMessageAt` is required and set at creation: a GSI only holds items that have the
  sort key, and an empty chat must still be listed.
- The deterministic chat id makes `openChat` idempotent (one chat per client/worker pair).

## 4. The `api` Lambda

- `resourceGroupName: 'data'`: the function is both a resolver of the API and a client of it;
  in its own stack that is a circular dependency between nested stacks.
- One handler for all operations keeps a single cold start and one log group.
- `handler.ts` only loads, checks ownership and writes; every decision that does not need I/O
  is a pure function in `rules.ts`.
- Errors: `RuleError(code)` → message `HANDUTY:<code>` (logged at `info`); a data client
  failure is logged at `error` with the operation name and surfaces as `HANDUTY:INTERNAL`.
- Overlap check: bookings of the service whose `startAt` is between `start − 120 min` and
  `end` (the longest booking is 120 min), then `rules.assertNoOverlap`.

## 5. Front end

- **Session** (`context/Session.jsx`): `loading → signedOut | needsProfile | ready | error`.
  It reloads on Hub `signedIn`/`signedOut` and after profile changes (`refresh`).
- **Guards** (`RequireSession`): signed-out users go to `/login`, users without a profile to
  `/complete-profile`, a page for the other role redirects to `/home`.
- **Closed sign-up** (`lib/config.js`, D12): unless the build sets `VITE_SIGN_UP_OPEN=true`,
  `/register` redirects to `/login` and the sign-up links are hidden. Accounts created in
  Cognito sign in with a temporary password; `Login` answers the
  `CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED` step with `confirmSignIn`, and the guard then
  sends the user to `/complete-profile` to pick a role and fill the profile.
- **Sign-up** (when open): step 1 (account) → step 2 (personal data) → `signUp` → step 3 (email code) →
  `confirmSignUp` → `signIn` → `registerProfile`. The step 2 data is kept in `sessionStorage`
  (`lib/pendingProfile.js`) so a reload or a sign-in from the login page can finish it in
  `/complete-profile`.
- **Data access**: `lib/api.js` `run`/`unwrap` turn `{ data, errors }` into a value or an
  `ApiError`; `errorMessageId` maps rule codes and Cognito error names to message ids.
  `lib/queries.js` follows `nextToken` for the role-aware lists.
- **Booking calendar**: `busySlots` + the chosen duration feed `react-datepicker`'s
  `filterTime`, so taken slots cannot be picked; the Lambda checks again.
- **i18n**: `react-intl`, language from `navigator.language` (`en*` → English, else Spanish).
  Category names use the v1 Spanish ids (`Carpintería`…) mapped from the enum in
  `constants/categories.js`.
- Pages are `React.lazy` chunks; the entry chunk is ~240 kB (75 kB gzip).

## 6. Tests

| File | Env | Covers |
|---|---|---|
| `tests/rules.test.ts` | node | every business rule and error code |
| `tests/api.test.js` | node | error mapping, `unwrap`, locale key parity, every backend code translated |
| `tests/register.test.jsx` | jsdom | step validation, underage refusal, sign-up → confirm → profile, Cognito error |
| `tests/login.test.jsx` | jsdom | sign-in, first sign-in with a new password (validated) |
| `tests/book.test.jsx` | jsdom | total price, booking call, busy slot refused locally, backend rule message |

Amplify, Cognito and the session are mocked at the module boundary (`vi.mock`); no test
needs AWS.

## 7. Code standards

`CODESTYLE.md`. Logs use a `[tag]` prefix (`[api]`, `[session]`, `[messages]`…), `error` for
what failed and must be looked at, `warn` for what the app works around, `info` for events.
