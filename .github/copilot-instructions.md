# Workspace Overview
- Next.js 16 App Router project (`src/app`) with TypeScript and Tailwind CSS v4. Fonts configured in `src/app/layout.tsx`; page content currently lives in `src/app/page.tsx`.
- UI layer is based on shadcn/ui. All generated components live in `src/components/ui`, utilities in `src/lib/utils.ts`, and hooks in `src/hooks`. Import UI elements via the `@` alias (e.g. `@/components/ui/button`).
- Styling relies on Tailwind 4 + CSS variables in `src/app/globals.css`. Theme tokens (`--color-*`, `--radius`) power shadcn components, so adjust or extend styles there rather than editing individual component files.

# Data & Persistence
- SQLite database stored at `sqlite.db`; ignored by git. Drizzle ORM setup:
  - Schema definitions go in `src/lib/db/schema.ts`.
  - Drizzle client factory in `src/lib/db/index.ts` memoizes a single Better-SQLite3 instance with WAL enabled. Import the exported `db` inside server components, route handlers, or server actions only.
  - Drizzle configuration in `drizzle.config.ts` controls migration output to `drizzle/`.
- Database workflow:
  - Edit schema → `npm run db:generate` to create migrations in `drizzle/`.
  - Inspect migration SQL, commit it, then apply locally with `npm run db:migrate`.
  - `npm run db:studio` launches Drizzle Studio for browsing data.

# Environment Variables
- Versioned `.env` contains safe defaults (e.g. `DATABASE_URL=file:sqlite.db`).
- Each developer/server copies it to `.env.local` for secrets; this file is git-ignored but loaded by Next.js with higher precedence.

# Project Conventions
- Module alias `@/*` resolves to `src/*` (see `tsconfig.json`). Use it for all internal imports to keep paths consistent after refactors.
- Prefer generating UI primitives with `npx shadcn@latest add <component>` to keep styles aligned with the shared `components.json` configuration.
- Client vs. server files follow the Next.js 13+ convention (`"use client"` at top when needed). Database access should remain server-side because `better-sqlite3` is synchronous and non-browser compatible.
- Tailwind animations rely on `tw-animate-css`; include relevant classes rather than custom keyframes unless global behavior is required.

# Helpful Commands
- `npm run dev` – local dev server.
- `npm run build` / `npm run start` – production build & serve.
- `npm run lint` – ESLint (Next.js config).
- `npm run db:generate` / `npm run db:migrate` / `npm run db:studio` – Drizzle tooling.
- `npx shadcn@latest add <component>` – fetch additional UI blocks.

# Gotchas
- Never commit `sqlite.db` or `drizzle/` migrations generated from another branch without reviewing diffs—they reflect schema state and can conflict quickly.
- Drizzle client uses a global cache; avoid creating new Better-SQLite3 instances manually.
- Keep shared instructions in `instructions.instructions.md`; update when workflows change so human + AI collaborators stay aligned.
