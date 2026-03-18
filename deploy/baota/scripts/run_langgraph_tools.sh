#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
ENV_FILE="${1:-${PROJECT_ROOT}/deploy/baota/env/tools.env}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

PORT="${TOOLS_SERVICE_PORT:-18080}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

cd "${PROJECT_ROOT}/zhijian_langgraph"
exec "${PYTHON_BIN}" -m uvicorn tools_service.app:app --host 127.0.0.1 --port "${PORT}"
