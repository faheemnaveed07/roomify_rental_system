# ──────────────────────────────────────────────────────────────────────────
# Roomify Backend — production image for Hugging Face Spaces (Docker SDK)
# Multi-stage build: compile TypeScript in a builder, ship a slim runtime.
# The app listens on PORT 7860 (the port Hugging Face Spaces exposes).
# ──────────────────────────────────────────────────────────────────────────

# ---------- Stage 1: Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install ALL dependencies (incl. devDeps: typescript + tsc-alias) using the
# lockfile for reproducible builds. Copying only the manifests first lets
# Docker cache this layer until dependencies actually change.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the sources needed to compile, then build.
# `npm run build` = `tsc && tsc-alias` -> emits dist/ and rewrites the
# @shared / @config path aliases to real relative paths so Node can resolve
# them at runtime (plain `tsc` does NOT do this).
COPY tsconfig.json ./
COPY src ./src
COPY shared ./shared
RUN npm run build

# Drop devDependencies so only production deps are carried to the runtime stage.
RUN npm prune --omit=dev

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine AS runner
ENV NODE_ENV=production
# Hugging Face Spaces routes traffic to this port; the app reads process.env.PORT.
ENV PORT=7860
WORKDIR /app

# Run as a non-root user (uid 1000 = the user Hugging Face runs containers as).
RUN addgroup -g 1000 appuser \
 && adduser -u 1000 -G appuser -s /bin/sh -D appuser

# Bring over only what the runtime needs: pruned node_modules + compiled output.
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/dist ./dist
COPY --chown=appuser:appuser package.json ./

# Writable dirs for winston logs and Multer's temp uploads.
# NOTE: the HF Spaces filesystem is EPHEMERAL — anything written here is lost on
# restart/rebuild. Keep persistent files (property images, documents) on
# Cloudinary / S3, which this app already supports.
RUN mkdir -p logs uploads && chown -R appuser:appuser logs uploads

USER appuser
EXPOSE 7860

# Container-level health probe against the existing health route.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:7860/api/health || exit 1

CMD ["node", "dist/src/index.js"]
