#!/usr/bin/env bash

set -euo pipefail

# 宝塔服务器发布脚本：
# 1. 解压发布包
# 2. 备份当前线上版本
# 3. 覆盖前端静态资源、后端 Jar 与 AI 源码
# 4. 重启服务并做健康检查
BUNDLE_PATH="${1:-}"
LIVE_ROOT="${LIVE_ROOT:-/www/wwwroot/zhijian}"
BACKUP_ROOT="${BACKUP_ROOT:-/www/backup}"
BACKEND_SERVICE="${BACKEND_SERVICE:-zhijian-backend}"
TOOLS_CONTAINER="${TOOLS_CONTAINER:-zhijian-tools}"
AGENT_CONTAINER="${AGENT_CONTAINER:-zhijian-langgraph}"
TMP_DIR="$(mktemp -d)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/zhijian_release_${TIMESTAMP}"

if [[ -z "${BUNDLE_PATH}" || ! -f "${BUNDLE_PATH}" ]]; then
  echo "Usage: $0 <release-bundle.tar.gz>" >&2
  exit 1
fi

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

# 统一的健康检查函数，避免服务重启后立刻继续执行导致链路未就绪。
wait_http_ok() {
  local url="$1"
  local retries="${2:-30}"
  local sleep_secs="${3:-2}"
  local i
  for ((i=1; i<=retries; i++)); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      return 0
    fi
    sleep "${sleep_secs}"
  done
  return 1
}

mkdir -p "${BACKUP_DIR}"
tar -C "${TMP_DIR}" -xzf "${BUNDLE_PATH}"

# 先备份线上文件，保证发布失败时仍然有可回滚版本。
cp -a "${LIVE_ROOT}/customer" "${BACKUP_DIR}/"
cp -a "${LIVE_ROOT}/merchant" "${BACKUP_DIR}/"
cp -a "${LIVE_ROOT}/admin" "${BACKUP_DIR}/"
cp -a "${LIVE_ROOT}/zhijian-start-0.0.1-beta-SNAPSHOT.jar" "${BACKUP_DIR}/"
cp -a "${LIVE_ROOT}/Dockerfile.langgraph" "${LIVE_ROOT}/Dockerfile.tools" "${LIVE_ROOT}/docker-compose.langgraph.yml" "${BACKUP_DIR}/"
tar --exclude='.venv' --exclude='.langgraph_api' --exclude='.idea' -C "${LIVE_ROOT}" -cf "${BACKUP_DIR}/zhijian_langgraph.tar" zhijian_langgraph

# 前端采用整目录替换的方式更新，避免旧静态资源残留。
rm -rf "${LIVE_ROOT}/customer" "${LIVE_ROOT}/merchant" "${LIVE_ROOT}/admin"
cp -a "${TMP_DIR}/customer" "${LIVE_ROOT}/customer"
cp -a "${TMP_DIR}/merchant" "${LIVE_ROOT}/merchant"
cp -a "${TMP_DIR}/admin" "${LIVE_ROOT}/admin"
chown -R www:www "${LIVE_ROOT}/customer" "${LIVE_ROOT}/merchant" "${LIVE_ROOT}/admin"

cp -f "${TMP_DIR}/zhijian-start-0.0.1-beta-SNAPSHOT.jar" "${LIVE_ROOT}/zhijian-start-0.0.1-beta-SNAPSHOT.jar"
chown www:www "${LIVE_ROOT}/zhijian-start-0.0.1-beta-SNAPSHOT.jar"

# AI 代码和相关容器定义文件一起覆盖，保证服务器端容器与源码一致。
cp -f "${TMP_DIR}/Dockerfile.langgraph" "${LIVE_ROOT}/Dockerfile.langgraph"
cp -f "${TMP_DIR}/Dockerfile.tools" "${LIVE_ROOT}/Dockerfile.tools"
cp -f "${TMP_DIR}/docker-compose.langgraph.yml" "${LIVE_ROOT}/docker-compose.langgraph.yml"
rm -rf "${LIVE_ROOT}/zhijian_langgraph/agent" "${LIVE_ROOT}/zhijian_langgraph/tools_service"
cp -a "${TMP_DIR}/zhijian_langgraph/agent" "${LIVE_ROOT}/zhijian_langgraph/"
cp -a "${TMP_DIR}/zhijian_langgraph/tools_service" "${LIVE_ROOT}/zhijian_langgraph/"
cp -f "${TMP_DIR}/zhijian_langgraph/requirements.txt" "${LIVE_ROOT}/zhijian_langgraph/requirements.txt"
cp -f "${TMP_DIR}/zhijian_langgraph/pyproject.toml" "${LIVE_ROOT}/zhijian_langgraph/pyproject.toml"
cp -f "${TMP_DIR}/zhijian_langgraph/langgraph.json" "${LIVE_ROOT}/zhijian_langgraph/langgraph.json"
cp -f "${TMP_DIR}/zhijian_langgraph/dev.txt" "${LIVE_ROOT}/zhijian_langgraph/dev.txt"

# 后端重启成功后，先检查接口文档是否能正常访问。
systemctl restart "${BACKEND_SERVICE}"
wait_http_ok "http://127.0.0.1:8080/api/doc.html" 45 2

# 如果 AI 容器当前在线，则把最新源码注入容器并重启。
if docker ps --format '{{.Names}}' | grep -qx "${TOOLS_CONTAINER}"; then
  docker cp "${LIVE_ROOT}/zhijian_langgraph/tools_service/." "${TOOLS_CONTAINER}:/app/tools_service/"
  docker cp "${LIVE_ROOT}/zhijian_langgraph/agent/." "${AGENT_CONTAINER}:/app/agent/"
  docker cp "${LIVE_ROOT}/zhijian_langgraph/requirements.txt" "${TOOLS_CONTAINER}:/app/requirements.txt"
  docker cp "${LIVE_ROOT}/zhijian_langgraph/requirements.txt" "${AGENT_CONTAINER}:/app/requirements.txt"
  docker restart "${TOOLS_CONTAINER}" "${AGENT_CONTAINER}" >/dev/null
fi

# AI 组件健康检查通过后，才视为整次发布完成。
wait_http_ok "http://127.0.0.1:18080/health" 30 2
wait_http_ok "http://127.0.0.1:18081/health" 30 2

echo "Deployed bundle: ${BUNDLE_PATH}"
echo "Backup directory: ${BACKUP_DIR}"
