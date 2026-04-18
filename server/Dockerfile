# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package*.json ./

# Install all deps (including devDeps for potential build steps)
RUN npm ci --omit=dev

# ─── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS production

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY . .

# Remove any local .env so Docker env vars take precedence
RUN rm -f .env

# Own the files by the non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Expose the API port
EXPOSE 5000

# Healthcheck – hits the /api/health endpoint every 30 s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
