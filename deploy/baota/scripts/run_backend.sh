#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
ENV_FILE="${1:-${PROJECT_ROOT}/deploy/baota/env/backend.env}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

JAR_PATH="${BACKEND_JAR_PATH:-${PROJECT_ROOT}/backend/zhijian-start/target/zhijian-start-0.0.1-beta-SNAPSHOT.jar}"
JAVA_BIN="${JAVA_BIN:-java}"
SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-prod}"
JAVA_OPTS_VALUE="${JAVA_OPTS:--Xms512m -Xmx1024m}"

if [[ ! -f "${JAR_PATH}" ]]; then
  echo "Missing jar: ${JAR_PATH}" >&2
  exit 1
fi

read -r -a JAVA_OPTS_ARRAY <<< "${JAVA_OPTS_VALUE}"

exec "${JAVA_BIN}" "${JAVA_OPTS_ARRAY[@]}" -jar "${JAR_PATH}" --spring.profiles.active="${SPRING_PROFILES_ACTIVE}"
