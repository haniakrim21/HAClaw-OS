# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm rebuild argon2

# ── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build expects these at build time (safe defaults for SSR pages)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -- --webpack

# ── Stage 3: Production image ────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# System deps for argon2 native addon
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
  && rm -rf /var/lib/apt/lists/*

# Copy built app + runtime files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/db ./db
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -sf http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
