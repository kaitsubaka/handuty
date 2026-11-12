# TODO

Current limitations and work still to do. Implemented changes belong in `CHANGELOG.md`.

## Deploy (the owner does these)

- Install the AWS CLI (`winget install Amazon.AWSCLI`), sign in with IAM Identity Center
  (`aws configure sso`) and bootstrap the account once (`npx ampx sandbox` explains it on the
  first run). Then `npx ampx sandbox` deploys a personal copy and writes
  `amplify_outputs.json`.
- Create an AWS Budgets alert (for example USD 1/month) before sharing the app.
- Amplify Hosting: connect the GitHub repository and branch, keep `amplify.yml`, and add the
  SPA rewrite rule `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>`
  → `/index.html` (200).

## Verification after the first deploy

- Check that `Message.onCreate` subscriptions deliver to both participants and to nobody else
  (owner filtering with `ownersDefinedIn('participants')` on events written by IAM).
- Check that secondary indexes on the `category` enum field deploy and answer
  `servicesByCategory`.
- Check that the Cognito default email sender delivers the verification code (it is limited
  to a few emails per day; SES is needed for real traffic).

## Backend

- Double booking under concurrency: two clients booking the same slot at the same instant can
  both pass the overlap check. A DynamoDB transaction with one lock item per service slot
  would close it.
- `rateBooking` updates the service average with read-then-write; two ratings at the same
  instant can lose one. An atomic `ADD` on `ratingSum`/`ratingCount` would fix it.
- `busySlots` reads at most 1000 upcoming bookings of a service.
- No rate limiting on `sendMessage` beyond AppSync's own limits.
- Account deletion and data export are not implemented.

## Front end

- The v1 layout is desktop-first (fixed 270 px sidebar, `vh`/`vw` sizes); it needs a mobile
  layout.
- CSS class names are still the v1 Spanish ones (`.citas`, `.perfil`…).
- Search loads every service to build the autocomplete; fine for a demo, needs a search index
  (or a `workerName` index) at scale.
- Profile photos are the same placeholder avatar for everyone.
- The v1 "QR" icon on appointments was a placeholder and was dropped; check-in by QR is not
  implemented.
