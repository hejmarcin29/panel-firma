<<<<<<< HEAD
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
=======
# Panel – Basic Reset

Ten projekt został zresetowany do minimalnego szablonu opartego o Next.js 15 (App Router, TypeScript). Startujemy od czystego UI i będziemy iteracyjnie dokładać warstwy (DB, auth, komponenty UI).

## Co jest na pokładzie teraz
- Next.js 15, App Router, TypeScript
- Strona główna z prostym komunikatem
- Brak bazy danych i backendu (API) – świadomie, zaczynamy od frontu

## Jak uruchomić
1. Zainstaluj zależności
2. Uruchom tryb deweloperski

## Reset bazy (jeśli dodasz DB w kolejnych krokach)
- Dostępna jest komenda pomocnicza:
  - Reset lokalnej bazy: tworzy backup i usuwa plik DB oraz pliki WAL/SHM.

## Kierunek rozwoju (proponowana ścieżka)
1. UI: proste widoki i routing
2. DB: podpięcie Drizzle + SQLite, generacja migracji
3. Auth: NextAuth (Credentials) – tylko gdy potrzebne
4. Komponenty UI: prymitywy (Button/Input/Label) i Toaster
5. Moduły domenowe (zlecenia/klienci) – krok po kroku

## Notatki
- Repo posiada historię. Gałąź `beta` zawierała poprzednią wersję systemu. Bieżąca gałąź (`reset/basic`) zawiera reset i minimalny start.
>>>>>>> dababeff8c8f75bf6fcf08091018b9a035607b77

Przepływ uploadu (presigned PUT):

1. Front prosi backend o URL: POST /api/zlecenia/:id/zalaczniki/presign z { filename, mime, size, category }.
2. Dostaje { url, key, publicUrl } i wykonuje PUT bezpośrednio do R2.
3. Po sukcesie zgłasza metadane: POST /api/zlecenia/:id/zalaczniki z { key, publicUrl, category, mime?, size? }.
4. Lista: GET /api/zlecenia/:id/zalaczniki. Usuwanie: DELETE /api/zlecenia/:id/zalaczniki/:attId (twarde usunięcie z R2 i DB).

Konwencja kluczy (ścieżek) w R2:

- clients/<NrKlienta-Slug>/YYYY/MM/<kategoria>/<YYYYMMDD**v01**nazwa_pliku.ext>
- Przykład: clients/10-jan-kowalski/2025/09/photos/20250928**v01**jan-kowalski.jpg

UI:

<<<<<<< HEAD
This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
- Sekcja „Załączniki” w szczegółach zlecenia: drag&drop multi‑upload, lista z podglądem (obraz/PDF), pobraniem i usuwaniem, galeria zdjęć.
>>>>>>> dababeff8c8f75bf6fcf08091018b9a035607b77
