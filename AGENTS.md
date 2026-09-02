# Repository Guidelines

## Project Structure & Module Organization

This repository contains a personal finance mobile app built with Expo and React Native. Route-level screens belong in `app/`. Place business capabilities under `src/features/`, grouped by domain such as `transactions`, `wallets`, `fixed-costs`, and `slip-scanning`. Shared UI belongs in `src/components/`; business rules and types in `src/domain/`; database schemas and migrations in `src/database/`; external integrations in `src/services/`. Store images, fonts, and icons in `assets/`. Keep automated tests beside the code as `*.test.ts` or `*.test.tsx`.

Architectural decisions belong in `docs/adr/`. Use `CONTEXT.md` for the project glossary and domain boundaries.

## Build, Test, and Development Commands

Run commands from the repository root:

- `npm install` — install dependencies from the lockfile.
- `npx expo start` — start the Expo development server.
- `npm run android` — launch the app on Android.
- `npm run lint` — run static analysis.
- `npm test` — execute the automated test suite.
- `npx expo export` — verify that a production bundle can be generated.

Update this section whenever package scripts change.

## Coding Style & Naming Conventions

Use TypeScript, two-space indentation, semicolons, and single quotes. Prefer small functional React components and keep business logic outside screens. Name components in PascalCase (`TransactionCard.tsx`), hooks with a `use` prefix (`useWallets.ts`), and utilities in camelCase. Use kebab-case for route folders. Run the configured formatter and linter before committing.

## Testing Guidelines

Test financial calculations, recurring fixed-cost generation, wallet transfers, and slip parsing as high-risk behavior. Use descriptive names such as `creates a transfer without changing total balance`. Add regression tests for every bug fix. Tests must be deterministic and must not call live banking or OCR services.

## Commit & Pull Request Guidelines

The repository has no established history yet. Use Conventional Commits, for example `feat(wallets): add account balance` or `fix(slips): reject duplicate receipt`. Keep commits focused. Pull requests should explain the change, link the relevant GitHub issue, list verification performed, and include screenshots or recordings for UI changes.

## Security & Configuration

Never commit bank credentials, receipt images, API keys, or personal financial exports. Keep local secrets in ignored environment files and document required variable names in `.env.example`.

## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues for `Exserlot/My-Wallet`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the repository's five canonical triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository. See `docs/agents/domain.md`.
