#!/usr/bin/env bash

set -euo pipefail

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

cp -a "${LIVE_ROOT}/customer" "${BACKUP_DIR}/"
cp -a "${LIVE_ROOT}/merchant" "${BACKUP_DIR}/"
cp -a "${LIVE_ROOT}/admin" "${BACKUP_DIR}/"
cp -a "${LIVE_ROOT}/zhijian-start-0.0.1-beta-SNAPSHOT.jar" "${BACKUP_DIR}/"
cp -a "${LIVE_ROOT}/Dockerfile.langgraph" "${LIVE_ROOT}/Dockerfile.tools" "${LIVE_ROOT}/docker-compose.langgraph.yml" "${BACKUP_DIR}/"
tar --exclude='.venv' --exclude='.langgraph_api' --exclude='.idea' -C "${LIVE_ROOT}" -cf "${BACKUP_DIR}/zhijian_langgraph.tar" zhijian_langgraph

rm -rf "${LIVE_ROOT}/customer" "${LIVE_ROOT}/merchant" "${LIVE_ROOT}/admin"
cp -a "${TMP_DIR}/customer" "${LIVE_ROOT}/customer"
cp -a "${TMP_DIR}/merchant" "${LIVE_ROOT}/merchant"
cp -a "${TMP_DIR}/admin" "${LIVE_ROOT}/admin"
chown -R www:www "${LIVE_ROOT}/customer" "${LIVE_ROOT}/merchant" "${LIVE_ROOT}/admin"

cp -f "${TMP_DIR}/zhijian-start-0.0.1-beta-SNAPSHOT.jar" "${LIVE_ROOT}/zhijian-start-0.0.1-beta-SNAPSHOT.jar"
chown www:www "${LIVE_ROOT}/zhijian-start-0.0.1-beta-SNAPSHOT.jar"

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

systemctl restart "${BACKEND_SERVICE}"
wait_http_ok "http://127.0.0.1:8080/api/doc.html" 45 2

if docker ps --format '{{.Names}}' | grep -qx "${TOOLS_CONTAINER}"; then
  docker cp "${LIVE_ROOT}/zhijian_langgraph/tools_service/." "${TOOLS_CONTAINER}:/app/tools_service/"
  docker cp "${LIVE_ROOT}/zhijian_langgraph/agent/." "${AGENT_CONTAINER}:/app/agent/"
  docker cp "${LIVE_ROOT}/zhijian_langgraph/requirements.txt" "${TOOLS_CONTAINER}:/app/requirements.txt"
  docker cp "${LIVE_ROOT}/zhijian_langgraph/requirements.txt" "${AGENT_CONTAINER}:/app/requirements.txt"
  docker restart "${TOOLS_CONTAINER}" "${AGENT_CONTAINER}" >/dev/null
fi

wait_http_ok "http://127.0.0.1:18080/health" 30 2
wait_http_ok "http://127.0.0.1:18081/health" 30 2

echo "Deployed bundle: ${BUNDLE_PATH}"
echo "Backup directory: ${BACKUP_DIR}"
