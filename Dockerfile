# -------------------- Deps (installs dev deps too) --------------------
FROM node:20-alpine AS deps
WORKDIR /app
# Helpful for some native modules used by Next.js
RUN apk add --no-cache libc6-compat
COPY package*.json ./
# Install ALL deps (including dev) so TypeScript is present for next.config.ts
RUN npm ci

# -------------------- Build --------------------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build without baking any runtime env; your NEXT_PUBLIC_* will be provided at `docker run`
RUN npm run build

# -------------------- Runtime (lean) --------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat

# Copy package files and production-only node_modules
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev

# Copy the built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Ensure Next respects the port you pass at runtime
ENV PORT=3015
EXPOSE 3015

# Your package.json "start" should be: "next start -p $PORT"
CMD ["npm", "start"]
