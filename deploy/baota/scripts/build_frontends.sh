#!/usr/bin/env bash

set -euo pipefail

# 宝塔前端构建脚本。
# 不传参数时默认构建 customer、merchant、admin，也支持按需指定应用列表。
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

  # 锁文件存在时优先使用 npm ci，保证线上构建结果稳定可复现。
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi

  npm run build
done
