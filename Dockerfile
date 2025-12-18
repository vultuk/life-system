FROM oven/bun:1 AS base
WORKDIR /app

# Accept build argument for which service to build (defaults to web frontend)
ARG SERVICE=apps/web
# Bake SERVICE into the image so it's available at runtime
ENV SERVICE=${SERVICE}

# API URL for the web frontend (Vite embeds at build time)
ARG VITE_API_URL=https://life-gateway.up.railway.app
ENV VITE_API_URL=${VITE_API_URL}

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

# Start script that handles different service types
# - web: serve static files
# - mcp-server: run HTTP mode (src/http.ts)
# - others: run standard entry point (src/index.ts)
CMD ["sh", "-c", "if [ \"$SERVICE\" = \"apps/web\" ]; then cd /app/apps/web && bunx serve -s dist -l $PORT; elif [ \"$SERVICE\" = \"apps/mcp-server\" ]; then cd /app/${SERVICE} && bun run src/http.ts; else cd /app/${SERVICE} && bun run src/index.ts; fi"]
