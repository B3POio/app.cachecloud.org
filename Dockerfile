# syntax=docker/dockerfile:1.7

##############################################
# Next.js 15 + React 19 production image
# - Build with devDependencies available
# - Prune to prod deps for runtime
##############################################

# 1) Install ALL dependencies (incl. dev) for building
FROM node:20-bookworm-slim AS deps-dev
WORKDIR /app
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# 2) Build the app using the full node_modules (typescript available)
FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .
# Uses your script: "next build --turbopack"
RUN --mount=type=cache,target=/root/.npm \
    npm run build

# 3) Install PRODUCTION-ONLY dependencies in a clean layer
FROM node:20-bookworm-slim AS prod-deps
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# 4) Minimal runtime image
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3015

# Use the built-in non-root 'node' user to avoid UID warnings
USER root
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder   /app/.next        ./.next
COPY --from=builder   /app/public       ./public
COPY --from=builder   /app/package.json ./package.json
# (Optional) include next.config file if you have one:
# COPY --from=builder /app/next.config.* ./  || true

# Switch to non-root user
USER node

EXPOSE 3015
CMD ["npm", "run", "start", "--", "-p", "3015"]
