#!/bin/bash
set -e

echo "Starting Backend..."
uv run python -m markoun.main &

echo "Starting Nginx..."
exec nginx -g "daemon off;"
