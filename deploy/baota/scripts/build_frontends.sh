#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

if [[ "$#" -eq 0 ]]; then
  APPS=(customer merchant admin)
else
  APPS=("$@")
fi

for app in "${APPS[@]}"; do
  APP_DIR="${PROJECT_ROOT}/frontend/apps/${app}"

  if [[ ! -d "${APP_DIR}" ]]; then
    echo "Unknown frontend app: ${app}" >&2
    exit 1
  fi

  echo "==> Building ${app}"
  cd "${APP_DIR}"

  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi

  npm run build
done
