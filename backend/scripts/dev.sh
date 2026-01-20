#!/bin/bash
# Development server startup script

set -e

echo "🚀 Starting Daily Progress Backend in development mode..."
echo "📍 Environment: ${NODE_ENV:-development}"

# Change to backend directory
cd "$(dirname "$0")/.."

# Run with bun in watch mode
exec bun run --watch src/main.ts
