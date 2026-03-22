#!/usr/bin/env bash

set -euo pipefail

# 生成宝塔发布包：
# 1. 构建后端 Jar 和三个 Web 端静态资源
# 2. 收集 AI 所需源码和容器文件
# 3. 打成一个可直接上传到服务器的发布压缩包
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
COMMIT_SHA="$(git -C "${PROJECT_ROOT}" rev-parse --short HEAD)"
RELEASE_DIR="${PROJECT_ROOT}/release"
STAGE_DIR="${RELEASE_DIR}/.stage_${TIMESTAMP}"
OUTPUT_FILE="${RELEASE_DIR}/zhijian_release_${COMMIT_SHA}_${TIMESTAMP}.tar.gz"

mkdir -p "${RELEASE_DIR}"
rm -rf "${STAGE_DIR}"
mkdir -p "${STAGE_DIR}/customer" "${STAGE_DIR}/merchant" "${STAGE_DIR}/admin"

# 发布包始终以“本地先构建、服务器只部署产物”为原则。
bash "${SCRIPT_DIR}/build_backend.sh"
bash "${SCRIPT_DIR}/build_frontends.sh" customer merchant admin

# 组织最终发布包目录结构，前端、后端、AI 文件分开收集。
cp -R "${PROJECT_ROOT}/frontend/apps/customer/dist/." "${STAGE_DIR}/customer/"
cp -R "${PROJECT_ROOT}/frontend/apps/merchant/dist/." "${STAGE_DIR}/merchant/"
cp -R "${PROJECT_ROOT}/frontend/apps/admin/dist/." "${STAGE_DIR}/admin/"
cp "${PROJECT_ROOT}/backend/zhijian-start/target/zhijian-start-0.0.1-beta-SNAPSHOT.jar" "${STAGE_DIR}/"
cp "${PROJECT_ROOT}/Dockerfile.langgraph" "${STAGE_DIR}/"
cp "${PROJECT_ROOT}/Dockerfile.tools" "${STAGE_DIR}/"
cp "${PROJECT_ROOT}/docker-compose.langgraph.yml" "${STAGE_DIR}/"
mkdir -p "${STAGE_DIR}/zhijian_langgraph"
cp -R "${PROJECT_ROOT}/zhijian_langgraph/agent" "${STAGE_DIR}/zhijian_langgraph/"
cp -R "${PROJECT_ROOT}/zhijian_langgraph/tools_service" "${STAGE_DIR}/zhijian_langgraph/"
cp "${PROJECT_ROOT}/zhijian_langgraph/requirements.txt" "${STAGE_DIR}/zhijian_langgraph/"
cp "${PROJECT_ROOT}/zhijian_langgraph/pyproject.toml" "${STAGE_DIR}/zhijian_langgraph/"
cp "${PROJECT_ROOT}/zhijian_langgraph/langgraph.json" "${STAGE_DIR}/zhijian_langgraph/"
cp "${PROJECT_ROOT}/zhijian_langgraph/dev.txt" "${STAGE_DIR}/zhijian_langgraph/"

cat > "${STAGE_DIR}/manifest.json" <<EOF
{
  "commit": "${COMMIT_SHA}",
  "created_at": "${TIMESTAMP}",
  "bundle": "$(basename "${OUTPUT_FILE}")"
}
EOF

# 产出压缩包和校验值，便于服务器校验与回溯。
tar -C "${STAGE_DIR}" -czf "${OUTPUT_FILE}" .
shasum -a 256 "${OUTPUT_FILE}" > "${OUTPUT_FILE}.sha256"
rm -rf "${STAGE_DIR}"

echo "${OUTPUT_FILE}"
