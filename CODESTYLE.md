# Code Style

## Language

- Code, identifiers, comments, commit messages and documentation are in English.
- User-facing text lives only in `src/locales/es.json` and `src/locales/en.json`, with the
  same keys in both (a test enforces it). Never hard-code UI text in a component.
- Known exception: the CSS class names inherited from v1 are in Spanish (`TODO.md`).

## Comments

- No meta-comments: no references to the current task, PR, ticket or caller.
- No reasoning or narration of what was tried. The code reads as if it was always this way.
- No comments that explain WHAT the code does; only the WHY when it is not obvious (a hidden
  constraint, an invariant, a workaround for an external bug).
- No links to docs or issues in code unless strictly necessary.
- No commented-out code, `// removed` markers or changelog-style comments.

## Code quality

- No dead code, stubs, placeholders or half-finished features.
- No TODO/FIXME comments in code: pending work goes to `TODO.md`.
- Every change is tested before it is considered done (`npm test`), and the build passes
  (`npm run build`, `npm run typecheck` for the backend).
- Business rules live in pure functions (`amplify/functions/api/rules.ts`) with unit tests;
  handlers only load, authorise and write.
- Never swallow errors. Log with a `[tag]` prefix: `console.error` for what failed and must be
  looked at, `console.warn` for a failure the app works around, `console.info` for events.
- Every error a user can cause reaches them as a translated message (`error.<CODE>`).

## Formatting

- Prettier formats everything (`.prettierrc.json`: single quotes, semicolons, trailing
  commas, 100 columns). Run `npm run format` before every commit.
- ESLint must report nothing (`npm run lint`): the React, Hooks and Fast Refresh rules for the
  front end and typescript-eslint for `amplify/`. Fix the finding instead of disabling the
  rule. The Amplify build runs `lint` and `format:check` and fails on either.
- React: function components and hooks; one page per file in `src/pages/` with its CSS next to
  it; shared pieces in `src/components/`.

## Dependencies

- After adding, removing or updating a package, run `npm install --package-lock-only` and
  `npm run check:lock`: npm can write a lockfile without the packages bundled inside the
  Amplify constructs, and the build's `npm ci` then refuses it.

## Branches (gitflow)

- `master` is production: it only receives merges from `release/*` and `hotfix/*`.
- `develop` is the integration branch; every `feature/*` starts from it and returns to it
  through a pull request.
- `feature/<kebab-name>` for new work, `release/<version>` to prepare a version (only fixes,
  version bump and `CHANGELOG.md`), `hotfix/<kebab-name>` from `master` for urgent fixes,
  merged back into both `master` and `develop`.
- Versions follow SemVer and are tagged on `master` (`v2.0.0`).
- Never push directly to `master` or `develop`; never force-push them.

## Commits

- Conventional Commits: `type(scope): summary` in the imperative, lower case, no final dot.
  Types: `feat`, `fix`, `docs`, `style`, `test`, `refactor`, `chore`, `build`, `ci`. Scopes: `auth`,
  `data`, `api`, `ui`, `deploy`.
- The body explains why when it is not obvious. Commits made with Claude end with its
  `Co-Authored-By` line.
- Pull request titles follow the same format; the description says what changed, why, and how
  it was tested.

## Tracking work

- Pending work and known limitations: `TODO.md` (bullets).
- Implemented changes: `CHANGELOG.md` (newest first, by date, Added / Changed / Fixed /
  Removed).
- Every change also updates the part of `SPECS.md`, `ARCHITECTURE.md` and `TASKS.md` it touches.
