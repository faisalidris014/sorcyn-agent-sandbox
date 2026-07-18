# Stage 1: Production dependencies + Prisma client generation
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma/schema.prisma prisma/schema.prisma
COPY prisma.config.ts ./

RUN npm ci --omit=dev
RUN npx prisma generate

# Stage 2: Build TypeScript
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY prisma/schema.prisma prisma/schema.prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY src/ src/
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy production node_modules (includes generated Prisma client)
COPY --from=deps /app/node_modules ./node_modules

# Copy compiled JS
COPY --from=build /app/dist ./dist

# Copy package.json for "type": "module"
COPY package.json ./

# Copy Prisma schema (needed at runtime by Prisma client)
COPY prisma/schema.prisma prisma/schema.prisma
COPY prisma.config.ts ./

# Copy migrations for prisma migrate deploy in production
COPY prisma/migrations prisma/migrations

ENV NODE_ENV=production
USER appuser
EXPOSE 3000

CMD ["node", "dist/server.js"]
