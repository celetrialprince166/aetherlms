# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Check for lockfile to ensure we have one
COPY package*.json ./

# USE CASE: If your build fails with "ERESOLVE unable to resolve dependency tree"
# We switch from 'npm ci' to 'npm install' with the legacy flag
RUN npm install --legacy-peer-deps

# Stage 2: Build the app
# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# 1. DISABLE TELEMETRY
ENV NEXT_TELEMETRY_DISABLED 1

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED 1

# Provide valid Base64 dummy strings (the string "dummy" encoded is "ZHVtbXk=")
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV CLERK_SECRET_KEY="ZHVtbXk=" 
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="ZHVtbXk="
ENV OPEN_AI_KEY="ZHVtbXk="
ENV CLOUDINARY_API_SECRET="ZHVtbXk="

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

# 4. RUN THE BUILD
RUN npm run build
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
