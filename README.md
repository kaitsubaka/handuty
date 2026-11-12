# Handuty

Handuty connects people who need a general service (carpentry, plumbing, painting, cleaning,
pet care…) with trained workers, quickly, easily and safely. Workers publish what they offer
with an hourly price; clients find them, book a time slot, chat with them and rate the job.

- Problem: finding a reliable person for a general service is hard and unsafe.
- Solution: a web platform that connects clients with workers by rating, hourly price and
  description of their work.

v1 was built in 2021 as a university project (React + Express + MongoDB). v2 rebuilds the
platform on a serverless AWS stack inside the Free Tier, keeping the original product design.
It was engineered with AI pair programming (Claude) using spec-driven development: every change
starts in `SPECS.md` and ends in tests and `CHANGELOG.md`.

## Stack

| Layer | Technology |
|---|---|
| Front end | React 19, Vite, React Router 7, Bootstrap 5, react-intl (es/en), d3 |
| Auth | Amazon Cognito (email + verification code), guest access for the landing chart |
| API | AWS AppSync (GraphQL) with owner-based authorization and live subscriptions |
| Data | Amazon DynamoDB (6 models, secondary indexes) |
| Business logic | One AWS Lambda (Node 22, arm64) for every write, pure rules with unit tests |
| Infrastructure | AWS Amplify Gen 2 (TypeScript, code-first), Amplify Hosting |
| Tests | Vitest + Testing Library (52 tests, no AWS needed) |

```
Browser ── reads ──► AppSync ──► DynamoDB        (owner rules decide what each user sees)
        ── writes ─► AppSync ──► Lambda `api` ──► rules.ts ──► AppSync (IAM) ──► DynamoDB
        ◄─ live ───  AppSync subscriptions (chat)
```

Details: [SPECS.md](SPECS.md) (decisions, business rules, data model),
[ARCHITECTURE.md](ARCHITECTURE.md) (how it is built).

## Features

- Sign-up in three steps (account, personal data, email code), adults only.
- Clients: browse 11 categories, search with autocomplete, filter by price, sort by name,
  price or rating, book a slot (taken slots are disabled), cancel, rate, chat with workers.
- Workers: publish one service per category, edit or delete it, see their bookings, chat.
- Personal data (phone, ID number, birth date, address) is readable only by its owner.
- Public landing page with a chart of workers per category.

## Run it

Requirements: Node 20+ and, for the backend, an AWS account with credentials on the machine.

```sh
npm install
npm test
npx ampx sandbox     # deploys a personal backend and writes amplify_outputs.json
npm run dev          # http://localhost:3000
```

Deploy: connect the repository in the Amplify console (Amplify Hosting); `amplify.yml`
deploys the backend, runs the tests and publishes the Vite build. See `TODO.md` for the
one-time console steps (SPA rewrite rule, budget alert).

## Credits

Illustrations from unDraw and Stories by Freepik; icons from FlatIcon (free to use).
v1 project presentation: https://youtu.be/iXBas3co0v8 · v1 demo: https://youtu.be/v_ypzvT571c
