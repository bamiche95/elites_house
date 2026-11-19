# Shared base: patched Alpine plus OpenSSL, which Prisma's query engine links
# against (the node:alpine image does not ship libssl).
FROM node:24-alpine AS base
WORKDIR /app
RUN apk upgrade --no-cache \
    && apk add --no-cache openssl libc6-compat

# Install dependencies in their own layer so editing source does not bust it.
FROM base AS deps
# This package runs `prisma generate` from `postinstall`, so the schema must be
# present *before* `npm ci` — copying only package*.json fails the install.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

FROM deps AS builder
# `next build` prerenders the database-backed marketing pages, so the build
# needs a reachable database. CI provisions a throwaway Postgres and passes
# these in; locally a `.env` in the build context also works. Any
# `NEXT_PUBLIC_*` value you need baked into the bundle (e.g. the site URL)
# must be supplied the same way.
ARG DATABASE_URL
ARG DIRECT_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Keep the OS packages patched and run as a non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S -G nodejs -u 1001 nextjs

# Copy runtime artefacts only: source, tooling and the build-time `.env*` files
# stay in the builder stage. `prisma/` ships the schema and migrations so a
# release can run `npx prisma migrate deploy` from this same image.
# Configuration is supplied at run time (`docker run -e`, Compose `env_file`, or
# your orchestrator's secret store).
COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts /app/tsconfig.json ./

USER nextjs
EXPOSE 3000

# Run the Next CLI directly. `npm start` forks a child process, so PID 1 never
# receives SIGTERM/SIGINT, and npm also needs a writable cache directory that
# the non-root `nextjs` user does not have.
CMD ["node", "node_modules/next/dist/bin/next", "start"]
