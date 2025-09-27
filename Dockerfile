# Use Node.js official image
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --only=production

# Copy source
COPY . .

# Build Next.js app (does not need env values baked in)
RUN npm run build

# Production runtime image
FROM node:20-alpine AS runner
WORKDIR /app

# Copy only what’s needed for runtime
COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public

# Expose runtime port
EXPOSE 3015

# Default command (runtime env vars will be injected with docker run)
CMD ["npm", "start"]
