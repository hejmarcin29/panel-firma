# Projekt panel (Next.js 15 + Drizzle + SQLite + shadcn)

Stack: Next.js (App Router), Tailwind v4 (minimal, pod shadcn), Drizzle ORM + SQLite (better-sqlite3), Auth.js (Credentials + Drizzle), Argon2id (@node-rs/argon2).

## Szybki start (dev)
1. Skopiuj `.env.example` do `.env.local` i uzupełnij `NEXTAUTH_SECRET`.
2. Uruchom dev: `npm run dev`.
3. Ekran setup admina jest pod `/setup` (działa tylko po dodaniu logiki tworzenia konta).

## Migracje Drizzle
- Konfiguracja: `drizzle.config.ts`.
- Generowanie: `npx drizzle-kit generate` (po dodaniu definicji w `src/db/schema.ts`).
- Migracja: `npx drizzle-kit migrate`.

## Notatki
- Baza w pliku `./data/app.db` (tworzony automatycznie). Tryb WAL i `busy_timeout=5000` ustawione.
- Hashing: Argon2id (@node-rs/argon2). Wrapper w `src/lib/hash.ts`.
- Auth: route `app/api/auth/[...nextauth]/route.ts` (Credentials + DrizzleAdapter).
- Tailwind: konfiguracja w `postcss.config.mjs`, tokeny w `src/app/globals.css`.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
