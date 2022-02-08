#!/usr/bin/env bash

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

COLOR_PREFIX="\e[32m"
COLOR_ERROR="\e[31m"
COLOR_RESET="\e[0m"

USAGE="$(basename "${0}") --scanner|--hook|--demo-target|--operator|--auto-discovery path/to/scanner/Chart.yaml path/to/.helm-docs"

DOC_TYPE="${1:-}"
CHART_FILE="${2:-}"
HELM_DOCS_DIR="${3:-}"

function log() {
  echo -e "${COLOR_PREFIX}SCB${COLOR_RESET} ${1}"
}

function error() {
  log >&2 "${COLOR_ERROR}ERROR${COLOR_RESET}: ${1}"
}

function validate_args() {
  if [[ -z "${DOC_TYPE}" ]]; then
    error "No doc type  given as first argument!"
    error "${USAGE}"
    exit 1
  fi

  if [[ -z "${CHART_FILE}" ]]; then
    error "No chart file given as second argument!"
    error "${USAGE}"
    exit 1
  fi

  if [[ -z "${HELM_DOCS_DIR}" ]]; then
    error "No helm docs dir given as third argument!"
    error "${USAGE}"
    exit 1
  fi
}

function generate_docs() {
  local chart_search_root output_file docs_template dockerhub_template

  chart_search_root="${1}"
  output_file="${2}"
  docs_template="${3}"
  dockerhub_template="${4}"

  helm-docs --log-level debug \
    --chart-search-root="${chart_search_root}" \
    --output-file="${output_file}" \
    --template-files="${HELM_DOCS_DIR}/templates.gotmpl" \
    --template-files="${docs_template}" \
    --template-files="${dockerhub_template}"
}

function generate_scanner_docs() {
  local scanner_dir parser_dir scanner_image_dir

  scanner_dir="${1}"
  parser_dir="${scanner_dir}/parser"
  scanner_image_dir="${scanner_dir}/scanner"

  if [ -d "${parser_dir}" ]; then
    log "Parser found at: '${parser_dir}'. Generating parser doc..."

    generate_docs "${scanner_dir}" \
      "docs/README.DockerHub-Parser.md" \
      "${scanner_dir}/.helm-docs.gotmpl" \
      "${HELM_DOCS_DIR}/README.DockerHub-Parser.md.gotmpl"
    # XXX: #754 Why is here no generation for ArtifactHub?
  else
    log "No parser found '${parser_dir}'! Skipping parser doc."
  fi

  if [ -d "${scanner_image_dir}" ]; then
    log "Scanner found at: '${scanner_image_dir}'. Generating scanner doc..."

    generate_docs "${scanner_dir}" \
      "docs/README.DockerHub-Scanner.md" \
      "${scanner_dir}/.helm-docs.gotmpl" \
      "${HELM_DOCS_DIR}/README.DockerHub-Scanner.md.gotmpl"
      # XXX: #754 Why is here no generation for ArtifactHub?
  else
    log "No scanner found at '${scanner_image_dir}'! Skipping scanner doc."
  fi

  log "Generating main doc..."
  # XXX: #754 Why is here no generation for DockerHub?
  generate_docs "${scanner_dir}" \
    "docs/README.ArtifactHub.md" \
    "${scanner_dir}/.helm-docs.gotmpl" \
    "${HELM_DOCS_DIR}/README.ArtifactHub.md.gotmpl"
}

function generate_hook_docs() {
  local hook_dir

  hook_dir="${1}"

  generate_docs "${hook_dir}" \
    "docs/README.DockerHub-Hook.md" \
    "${hook_dir}/.helm-docs.gotmpl" \
    "${HELM_DOCS_DIR}/README.DockerHub-Hook.md.gotmpl"
  generate_docs "${hook_dir}" \
    "docs/README.ArtifactHub.md" \
    "${hook_dir}/.helm-docs.gotmpl" \
    "${HELM_DOCS_DIR}/README.ArtifactHub.md.gotmpl"
}

function generate_demo_target_docs() {
  local demo_target_dir

  demo_target_dir="${1}"

  generate_docs "${demo_target_dir}" \
    "docs/README.DockerHub-Target.md" \
    "${demo_target_dir}/.helm-docs.gotmpl" \
    "${HELM_DOCS_DIR}/README.DockerHub-Target.md.gotmpl"

  generate_docs "${demo_target_dir}" \
    "docs/README.ArtifactHub.md" \
    "${demo_target_dir}/.helm-docs.gotmpl" \
    "${HELM_DOCS_DIR}/README.ArtifactHub.md.gotmpl"
}

function generate_operator_docs() {
  local operator_dir

  operator_dir="${1}"

  generate_docs "${operator_dir}" \
    "docs/README.DockerHub-Core.md" \
    "${operator_dir}/.helm-docs.gotmpl" \
    "${HELM_DOCS_DIR}/README.DockerHub-Core.md.gotmpl"
  generate_docs "${operator_dir}" \
    "docs/README.ArtifactHub.md" \
    "${operator_dir}/.helm-docs.gotmpl" \
    "${HELM_DOCS_DIR}/README.ArtifactHub.md.gotmpl"
}

function generate_auto_discovery_docs() {
  local auto_discovery_dir

  auto_discovery_dir="${1}"

  generate_docs "${auto_discovery_dir}" \
    "docs/README.DockerHub-Core.md" \
    "${auto_discovery_dir}.helm-docs.gotmpl" \
    "${HELM_DOCS_DIR}/README.DockerHub-Core.md.gotmpl"
  generate_docs "${auto_discovery_dir}" \
    "docs/README.ArtifactHub.md" \
    "${auto_discovery_dir}.helm-docs.gotmpl" \
    "${HELM_DOCS_DIR}/README.ArtifactHub.md.gotmpl"
}

function main() {
  validate_args

  log "Generating docs for ${CHART_FILE}..."

  local work_dir docs_dir

  work_dir="$(dirname "${CHART_FILE}")"
  docs_dir="${work_dir}/docs"

  if [ ! -d "${docs_dir}" ]; then
    log "Ignoring docs creation process for '${CHART_FILE}' because docs folder found at: '${docs_dir}'!"
    exit 0
  fi

  case "${DOC_TYPE}" in
  "--scanner")
    generate_scanner_docs "${work_dir}"
    ;;
  "--hook")
    generate_hook_docs "${work_dir}"
    ;;
  "--demo-target")
    generate_demo_target_docs "${work_dir}"
    ;;
  "--operator")
    generate_operator_docs "${work_dir}"
    ;;
  "--auto-discovery")
    generate_auto_discovery_docs "${work_dir}"
    ;;
  *)
    error "Unsupported doc type: ${DOC_TYPE}!"
    error "${USAGE}"
    ;;
  esac
}

main
