# Stage 1: Install dependencies
FROM node:20-alpine AS deps
# Prisma and Alpine need openssl to load the engine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Stage 2: Build the app
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# --- DUMMY BUILD-TIME VARIABLES ---
# We use "ZHVtbXk=" which is Base64 for "dummy" to avoid InvalidCharacterErrors
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_ZHVtbXk="
ENV CLERK_SECRET_KEY="sk_test_ZHVtbXk="
ENV WIX_OAUTH_KEY="ZHVtbXk="
ENV OPEN_AI_KEY="ZHVtbXk="
ENV STRIPE_SECRET_KEY="sk_test_ZHVtbXk="
ENV STRIPE_WEBHOOK_SECRET="whsec_ZHVtbXk="
ENV NEXT_PUBLIC_VOICE_FLOW_KEY="VF.ZHVtbXk="
ENV VOICEFLOW_API_KEY="VF.ZHVtbXk="
ENV VOICEFLOW_KNOWLEDGE_BASE_API="https://dummy.com"
ENV CLOUDINARY_CLOUD_NAME="dummy"
ENV CLOUDINARY_API_KEY="12345"
ENV CLOUDINARY_API_SECRET="ZHVtbXk="
ENV MAILER_EMAIL="dummy@example.com"
ENV MAILER_PASSWORD="dummy"
ENV NEXT_PUBLIC_HOST_URL="http://localhost:3000"

# Generate Prisma Client (crucial before build)
RUN npx prisma generate

# Final build
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
