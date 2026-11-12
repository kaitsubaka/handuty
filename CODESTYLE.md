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

- 2-space indentation, single quotes, semicolons, trailing commas, lines up to ~110 chars.
- React: function components and hooks; one page per file in `src/pages/` with its CSS next to
  it; shared pieces in `src/components/`.

## Tracking work

- Pending work and known limitations: `TODO.md` (bullets).
- Implemented changes: `CHANGELOG.md` (newest first, by date, Added / Changed / Fixed /
  Removed).
- Every change also updates the part of `SPECS.md`, `ARCHITECTURE.md` and `TASKS.md` it touches.
