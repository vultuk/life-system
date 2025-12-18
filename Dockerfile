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

# Build the web frontend if SERVICE is apps/web
RUN if [ "$SERVICE" = "apps/web" ]; then \
      cd /app/apps/web && bun run build; \
    fi

# Start script that handles both service types
CMD ["sh", "-c", "if [ \"$SERVICE\" = \"apps/web\" ]; then cd /app/apps/web && bunx serve -s dist -l $PORT; else cd /app/${SERVICE} && bun run src/index.ts; fi"]
