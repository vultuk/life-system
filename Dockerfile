FROM oven/bun:1 AS base
WORKDIR /app

# Accept build argument for which service to build (defaults to web frontend)
ARG SERVICE=apps/web
ENV SERVICE=${SERVICE}

# Copy all workspace files
COPY package.json bun.lock ./
COPY packages ./packages
COPY apps ./apps
COPY tsconfig.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Railway injects PORT env var
ENV PORT=3000

# Start the specified service
CMD ["sh", "-c", "cd /app/${SERVICE} && bun run src/index.ts"]
