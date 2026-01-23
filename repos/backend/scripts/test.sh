#!/bin/bash
# Test runner script

set -e

echo "🧪 Running tests..."

# Change to backend directory
cd "$(dirname "$0")/.."

# Run tests based on argument
case "${1:-all}" in
  unit)
    echo "Running unit tests..."
    bun test tests/unit
    ;;
  integration)
    echo "Running integration tests..."
    bun test tests/integration
    ;;
  coverage)
    echo "Running tests with coverage..."
    bun test --coverage
    ;;
  watch)
    echo "Running tests in watch mode..."
    bun test --watch
    ;;
  all|*)
    echo "Running all tests..."
    bun test
    ;;
esac
