FROM oven/bun:1 AS base
WORKDIR /app

# Copy all workspace files
COPY package.json bun.lock ./
COPY packages ./packages
COPY apps ./apps
COPY tsconfig.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Railway injects PORT env var
ENV PORT=3000

# This Dockerfile is specific to the carddav service
CMD ["sh", "-c", "echo 'Starting carddav service from service-specific Dockerfile' && cd /app/apps/services/carddav && bun run src/index.ts"]
