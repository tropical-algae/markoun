#!/bin/bash
set -e

echo "Starting Backend..."
.venv/bin/python -m markoun.main &

echo "Starting Nginx..."
exec nginx -g "daemon off;"
