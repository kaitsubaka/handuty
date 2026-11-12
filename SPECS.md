# SPECS — Handuty

Status: **v2.0 (Amplify Gen 2 migration) implemented, waiting for the first cloud deploy** ·
Last revision: 2026-11-12

What Handuty does and why. How the code is built is in `ARCHITECTURE.md`, the task history in
`TASKS.md`, pending work in `TODO.md` and implemented changes in `CHANGELOG.md`.

## 1. Goal

Handuty connects people who need a general service (carpentry, painting, cleaning…) with
workers who offer it, quickly, easily and safely. Workers publish the services they offer with
an hourly price; clients find them, book a time slot, chat with the worker and rate the
service once it is done.

v1 (2021) was a React (CRA) front end plus an Express + MongoDB + socket.io API. It no longer
runs: CRA 4 does not start on current Node, the API stored plain-text passwords, several
controllers queried by the wrong filter, half the pages were not routed and the client and
worker views called endpoints that did not exist. v2 keeps the product and its look and moves
the back end to **AWS Amplify Gen 2**, inside the AWS Free Tier.

## 2. Decisions

| # | Decision | Why |
|---|---|---|
| D1 | Back end is Amplify Gen 2 (TypeScript, code-first): Cognito, AppSync + DynamoDB, one Lambda | Managed, serverless, scales to zero; every piece has a free tier |
| D2 | The Express API, MongoDB and socket.io are removed | AppSync replaces REST and its subscriptions replace socket.io |
| D3 | **Reads go straight to AppSync; every write goes through a custom mutation** handled by one Lambda (`api`) | Owner rules alone cannot enforce the business rules (no double booking, one service per category, a client rates only their own finished booking, the averaged rating cannot be forged) |
| D4 | Records reference users by Cognito `sub` (`identityClaim('sub')`) | One stable id across models, readable by owner rules, no `sub::username` strings |
| D5 | Data is denormalised (names, category, address copied into the records that show them) and there are no `belongsTo`/`hasMany` links | Each model can have its own auth rules without leaking the other model's fields through a nested selection; one query per screen |
| D6 | Personal data lives in `PrivateProfile`, readable only by its owner | Phone, ID number, birth date and address are never readable by other users |
| D7 | The booking keeps a copy of the client's address | The worker needs it for the visit without being able to read the client's private profile |
| D8 | Front end moves from CRA to Vite + React 19, React Router 7, Bootstrap 5 | CRA is unmaintained and does not run on Node 24 |
| D9 | The look (CSS, illustrations, icons) and the Spanish/English texts are kept | The product design was finished; only the plumbing was broken |
| D10 | Sign-up uses Cognito with email verification; the profile is created right after the first sign-in | No Cognito custom attributes or triggers to maintain; a user who confirmed on another device is sent to "complete profile" |
| D11 | The landing chart is public through the Identity Pool guest role (read-only `Service`) | v1 showed it to anonymous visitors |
| D12 | The deployed demo has no public sign-up: the owner creates the test accounts in Cognito, each sets its own password on the first sign-in and then completes its profile | Keeps strangers and spam out of a Free Tier demo and within Cognito's default email quota; `VITE_SIGN_UP_OPEN=true` plus `allowAdminCreateUserOnly: false` reopen the sign-up flow, which stays implemented and tested |

## 3. Roles and use cases

Two roles, chosen when the profile is created and never changed: `CLIENT` and `WORKER`.

| Id | Actor | Use case |
|---|---|---|
| UC1 | Visitor | Sees the landing page and a chart of how many workers offer each category |
| UC2 | Visitor | Signs up (2 steps), confirms the email code and lands on the home page |
| UC3 | User | Signs in / signs out |
| UC4 | Client | Browses the 11 categories or searches by category or worker name (autocomplete) |
| UC5 | Client | Filters results by price range and sorts by worker name or price |
| UC6 | Client | Books a service: start date/time (30 min slots, taken slots are disabled) and 30/60/90/120 min |
| UC7 | Client | Sees upcoming and past bookings, cancels an upcoming one, rates a past one (1–5) |
| UC8 | Worker | Adds, edits and deletes their services (one per category) |
| UC9 | Worker | Sees upcoming and past bookings of their services |
| UC10 | Client | Starts a chat with the worker of a booking or a service (a worker answers chats clients opened) |
| UC11 | Both | Chats in real time; the home page shows the next booking and the last message |
| UC12 | User | Sees their profile (private data shown only to themselves) and edits phone, city and address |

## 4. Business rules (enforced in the `api` Lambda)

- R1 Users are 18 or older (birth date checked on profile creation).
- R2 A profile is created once per user; the role cannot change afterwards.
- R3 Service: one per category per worker; price per hour ≥ 1000 (COP); description 10–160
  characters; category from the fixed list of 11.
- R4 Booking: only clients book; not in the past; starts on a 30-minute boundary; duration 30,
  60, 90 or 120 minutes; must not overlap another booking of the same service; total price =
  hourly price × hours.
- R5 Cancel: only the client of the booking, only before it starts.
- R6 Rate: only the client, only after the booking ended, only once, integer 1–5. The service
  keeps `ratingSum` / `ratingCount` and an average.
- R7 Deleting a service keeps its past bookings (they carry their own copy of the data); it is
  refused while the service has upcoming bookings.
- R8 Chats are opened by the client with a worker (one chat per pair); messages are 1–1000
  characters; only the two participants read the chat and its messages.

## 5. Data model

| Model | Key | Who can read | Notes |
|---|---|---|---|
| `Profile` | `userId` (sub) | any signed-in user | `name`, `role`, `city` |
| `PrivateProfile` | `userId` (sub) | owner | `phone`, `idNumber`, `birthDate`, `address` |
| `Service` | `id` | signed-in users, guests | `workerId`, `workerName`, `category`, `pricePerHour`, `description`, `ratingSum`, `ratingCount`, `rating`; indexes by `workerId`, by `category` |
| `Booking` | `id` | its client and its worker | `serviceId`, `clientId`, `workerId`, names, `category`, `address`, `startAt`, `endAt`, `price`, `rating`; indexes by `clientId`, `workerId`, `serviceId` (sorted by `startAt`) |
| `Chat` | `id` | its two participants | `clientId`, `workerId`, names, `participants`, `lastMessage`, `lastMessageAt`; indexes by `clientId`, `workerId` |
| `Message` | `id` | the chat's participants | `chatId`, `senderId`, `content`, `participants`; index by `chatId` sorted by `createdAt` |

No model accepts writes from users; writes are the custom mutations of §6.

## 6. API (custom operations)

Mutations: `registerProfile`, `editProfile`, `saveService` (create or edit), `removeService`,
`bookService`, `cancelBooking`, `rateBooking`, `openChat`, `sendMessage`. Each takes only
what the user decides; the caller's identity, names, prices and copies are filled in by the
Lambda.

Query: `busySlots(serviceId)` returns only the start and end of the upcoming bookings of a
service, so the booking calendar can disable taken slots without letting a client read other
clients' bookings.

Every rule violation comes back as a GraphQL error whose message is `HANDUTY:<CODE>`; the UI
shows the translation `error.<CODE>`.

## 7. Free Tier guardrails

- No always-on resources: no provisioned concurrency, NAT, RDS or OpenSearch.
- One Lambda, 512 MB, 10 s timeout, invoked only by writes.
- DynamoDB on demand; Cognito with its default email sender (no SES); AppSync user pool + IAM
  only (no API key to rotate).
- Lambda logs kept 1 week.
- Monthly cost for a demo is expected to stay at the free allowances: Lambda 1M requests and
  DynamoDB 25 GB are always free, Cognito's first 10k MAU are free, AppSync and Amplify Hosting
  are free for 12 months or covered by the new-account credits. An AWS Budgets alert is the
  owner's job (`TODO.md`).

## 8. Non-functional requirements

- Spanish and English UI chosen from the browser language (as in v1).
- Works on phone width (the v1 layout is desktop-first; see `TODO.md`).
- The business rules are pure functions with unit tests.
- Every error a user can cause is shown as a translated message, never a stack trace.
