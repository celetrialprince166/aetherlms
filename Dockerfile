# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Check for lockfile to ensure we have one
COPY package*.json ./

# USE CASE: If your build fails with "ERESOLVE unable to resolve dependency tree"
# We switch from 'npm ci' to 'npm install' with the legacy flag
RUN npm install --legacy-peer-deps

# Stage 2: Build the app
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build time
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ENV SKIP_DB_CHECK=true
ENV BUILD_MODE=static

# Generate Prisma Client (Important if using RDS)
RUN npx prisma generate

RUN npm run build:safe

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Don't run as root
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Standard Next.js Standalone configuration
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
