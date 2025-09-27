# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./
RUN npm ci --include=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_PATH=/app/.next/standalone/node_modules
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/migrate.mjs ./migrate.mjs

# SQLite data directory (mounted as volume at runtime)
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app
VOLUME ["/app/data"]

USER nextjs
EXPOSE 3000
ENV PORT=3000
# Run migrations before starting the server (ESM)
CMD node migrate.mjs && node server.js
