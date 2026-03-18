#!/usr/bin/env bash

set -euo pipefail

echo "Starting Smart Health Select docker deployment..."

if ! command -v docker >/dev/null 2>&1; then
    echo "Missing docker" >&2
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo "Missing docker compose v2" >&2
    exit 1
fi

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Created .env from .env.example. Fill real values before starting services." >&2
    exit 1
fi

echo "Booting containers with docker compose..."
docker compose up -d

echo "Done."
echo "Customer:   http://<server-ip>:3000"
echo "Merchant:   http://<server-ip>:3001"
echo "Admin:      http://<server-ip>:3002"
echo "Backend:    http://<server-ip>:8080/api"
echo "API docs:   http://<server-ip>:8080/api/doc.html"
echo "Logs:       docker compose logs -f backend"
