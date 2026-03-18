#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

cd "${PROJECT_ROOT}/backend"

if [[ "${CLEAN_BUILD:-0}" == "1" ]]; then
  mvn -q clean package -DskipTests
else
  mvn -q package -DskipTests
fi
