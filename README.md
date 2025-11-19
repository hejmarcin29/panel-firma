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

## WooCommerce webhook

Ustaw sekretny klucz webhooka w panelu **Ustawienia → Webhook WooCommerce**. Aplikacja zapisuje wartość w bazie danych, więc nie musisz edytować pliku `.env.local`.

Do integracji z wFirma wpisz w panelu wartości dla `WFIRMA_TENANT`, `WFIRMA_ACCESS_KEY` i `WFIRMA_SECRET_KEY`. Te dane są przechowywane w bazie i używane do autoryzacji żądań w trybie API Key.

Point the WooCommerce webhook URL to `/api/woocommerce/webhook`. The payload is verified with HMAC SHA-256 before the order is imported.
