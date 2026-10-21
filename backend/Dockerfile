FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY schema.prisma prisma.config.ts ./
RUN npm install

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN cp .env.example .env && npx prisma generate && rm .env

RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN groupadd -r nodejs && useradd -r -g nodejs nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/schema.prisma ./
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package.json ./package.json

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/main"]