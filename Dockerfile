# ============================================================
# ThermaShield 360 — Production Multi-Stage Container
# ============================================================

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies required for vite & esbuild)
RUN npm ci

# Copy full source tree
COPY . .

# Build frontend SPA & bundle backend into server.js
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled frontend and bundled server from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Non-root user for security
USER node

EXPOSE 3000

# Start server
CMD ["node", "server.js"]
