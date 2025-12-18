FROM oven/bun:1 AS base
WORKDIR /app

# Accept build argument for which service to build (defaults to web frontend)
ARG SERVICE=apps/web
# Bake SERVICE into the image so it's available at runtime (v2)
ENV SERVICE=${SERVICE}
# Force cache invalidation per service
ARG CACHE_BUST
RUN echo "Building service: ${SERVICE}"

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
#
# IMPORTANT: The $SERVICE env var is baked in at build time from the ARG.
# Railway passes SERVICE as a build arg for each service.
CMD ["sh", "-c", "echo \"=== DEBUG: SERVICE=$SERVICE ===\"; if [ \"$SERVICE\" = \"apps/web\" ]; then cd /app/apps/web && bunx serve -s dist -l $PORT; elif [ \"$SERVICE\" = \"apps/mcp-server\" ]; then cd /app/${SERVICE} && bun run src/http.ts; else echo \"=== Starting $SERVICE ===\"; cd /app/${SERVICE} && bun run src/index.ts; fi"]
