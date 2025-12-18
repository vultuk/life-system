#!/bin/bash
# Railway multi-service setup script
# Run this after: railway login && railway init

set -e

echo "Creating Railway services..."

# Create each service
railway service --create gateway
railway service --create contacts
railway service --create tasks
railway service --create notes
railway service --create habits
railway service --create mcp-server

echo ""
echo "Services created. Now configure each service in the Railway dashboard:"
echo ""
echo "For each service, set:"
echo "  1. Root Directory (Settings > Build)"
echo "     - gateway:    apps/gateway"
echo "     - contacts:   apps/services/contacts"
echo "     - tasks:      apps/services/tasks"
echo "     - notes:      apps/services/notes"
echo "     - habits:     apps/services/habits"
echo "     - mcp-server: apps/mcp-server"
echo ""
echo "  2. Build Command: cd <root-to-monorepo> && bun install"
echo "  3. Start Command: bun run src/index.ts"
echo ""
echo "Or use GitHub integration for automatic deployment."
