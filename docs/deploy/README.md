# Deploy (Docker + Caddy + SQLite) — examples

These are example files to help you deploy on a VPS. They contain placeholders and MUST be adjusted on the server. Do not commit real secrets.

## Files
- `docker-compose.example.yml` — Compose services for app + caddy, with a `/srv/prime/data:/data` bind mount.
- `Caddyfile.example` — Basic reverse proxy with HTTPS (Let’s Encrypt) and `admin off`.

## How to use
1. Copy these files to your server (or use them as a template in your infra repo):
   - `/srv/prime/caddy/Caddyfile`
   - `docker-compose.yml` in your project folder
2. Replace placeholders:
   - YOUR_DOMAIN → e.g. `b2b.example.com`
   - NEXTAUTH_SECRET → generate a strong random string (>= 32 chars)
3. Ensure directories exist on the host:
   - `/srv/prime/data` for persistent SQLite DB
   - `/srv/prime/caddy` for Caddyfile
4. Build and run:
   - `docker compose build app`
   - `docker compose up -d app caddy`
5. Check logs and cert issuance:
   - `docker compose logs -f --tail=100 app caddy`

## Notes
- DATABASE_URL must point to the bind-mounted DB file: `file:/data/panel.db`.
- Migrations are applied automatically on container start by `migrate.mjs`.
- Do backups before upgrades. For SQLite snapshots:
  - `sqlite3 /srv/prime/data/panel.db ".backup '/srv/prime/backups/panel-$(date +%F-%H%M).db'"`
- Do not generate migrations on the server. Generate locally, commit, push.

## Cloudflare R2 quick setup

To enable uploads to Cloudflare R2:

1) In Cloudflare dashboard → R2 → create a bucket (e.g., `b2b-primepodloga`). On the Settings tab copy the "S3 API" URL – that's your `R2_ENDPOINT` (e.g., `https://<accountid>.r2.cloudflarestorage.com`).
2) Create an R2 API Token with "Edit" permissions for this bucket. Save its `access_key_id` and `secret_access_key` → set as `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`.
3) Set environment variables in the `app` service (see `docker-compose.example.yml`): `R2_ENDPOINT`, `R2_REGION` (usually `auto`), `R2_BUCKET`, and `R2_PUBLIC_BASE_URL` (prefer a Custom Domain mapped to the bucket; alternatively use the Public Development URL or the S3 API URL with a bucket segment).
4) CORS: add a CORS rule in R2 allowing methods `PUT, GET, HEAD` and headers `Content-Type, Authorization` from your site origin (e.g., `https://YOUR_DOMAIN`).
5) (Optional) Add a Custom Domain for the bucket – then `R2_PUBLIC_BASE_URL` is like `https://cdn.YOUR_DOMAIN`.

In the app, the signing endpoint `/api/pliki/r2/presign` returns a temporary PUT URL and a final `publicUrl` you can embed in the UI.
