#!/usr/bin/env bash

set -euo pipefail

# 宝塔后端构建脚本。
# 默认直接打包；如果传入 CLEAN_BUILD=1，则先 clean 再打包。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

cd "${PROJECT_ROOT}/backend"

if [[ "${CLEAN_BUILD:-0}" == "1" ]]; then
  mvn -q clean package -DskipTests
else
  mvn -q package -DskipTests
fi
