# ---- Base image ----
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ---- Dependencies ----
FROM base AS deps
RUN apk add --no-cache python3 make g++ openssl
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --only=production
# Copy schema to generate Prisma Client against production deps
COPY prisma ./prisma
# Generate Prisma Client so it's available in prod node_modules
RUN npx prisma generate
# Snapshot production node_modules (includes generated client)
RUN cp -R node_modules /prod_node_modules

# ---- Build ----
FROM base AS build
ENV NODE_ENV=development
RUN apk add --no-cache python3 make g++ openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* .npmrc* ./
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src
COPY scripts ./scripts
COPY .prettierrc ./
RUN npm ci # devDependencies까지 설치
RUN npx prisma generate
RUN npm run build

# Prepare runtime assets (swagger export optional)
# RUN npm run swagger:ui:prepare || true

# ---- Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Copy production dependencies and build artifacts
COPY --from=deps /prod_node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

# Env & health
ENV PORT=7005
EXPOSE 7005

# Create persistent upload dir
RUN mkdir -p /data/uploads && chown -R nodejs:nodejs /data
ENV UPLOAD_DIR=/data/uploads

# Prisma needs the schema at runtime for migrate or generate (optional)
# HEALTHCHECK can be added with a lightweight curl if desired

USER nodejs
CMD ["node", "dist/src/main.js"]
