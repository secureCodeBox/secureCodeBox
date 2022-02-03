#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

COLOR_PREFIX="\e[32m"
COLOR_ERROR="\e[31m"
COLOR_RESET="\e[0m"

USAGE="$(basename "${0}") --scanner|--hook path/to/scanner/Chart.yaml path/to/.helm-docs"

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
  local chart_search_root output_file base_template docs_template dockerhub_template

  chart_search_root="${1}"
  output_file="${2}"
  base_template="${3}"
  docs_template="${4}"
  dockerhub_template="${5}"

  helm-docs --log-level debug \
    --chart-search-root="${chart_search_root}" \
    --output-file="${output_file}" \
    --template-files="${base_template}" \
    --template-files="${docs_template}" \
    --template-files="${dockerhub_template}"
}

function generate_scanner_docs() {
  log "Generating scanner docs for ${CHART_FILE}..."

  local scanner_dir docs_dir parser_dir scanner_image_dir

  scanner_dir="$(dirname "${CHART_FILE}")"
  docs_dir="${scanner_dir}/docs"
  parser_dir="${scanner_dir}/parser"
  scanner_image_dir="${scanner_dir}/scanner"

  if [ ! -d "${docs_dir}" ]; then
    log "Ignoring docs creation process for '${CHART_FILE}' because docs folder found at: '${docs_dir}'!"
    exit 0
  fi

  if [ -d "${parser_dir}" ]; then
    log "Parser found at: '${parser_dir}'. Generating parser doc..."

    generate_docs "${scanner_dir}" \
      "docs/README.DockerHub-Parser.md" \
      "${HELM_DOCS_DIR}/templates.gotmpl" \
      "${scanner_dir}/.helm-docs.gotmpl" \
      "${HELM_DOCS_DIR}/README.DockerHub-Parser.md.gotmpl"
  else
    log "No parser found '${parser_dir}'! Skipping parser doc."
  fi

  if [ -d "${scanner_image_dir}" ]; then
    log "Scanner found at: '${scanner_image_dir}'. Generating scanner doc..."

    generate_docs "${scanner_dir}" \
      "docs/README.DockerHub-Scanner.md" \
      "${HELM_DOCS_DIR}/templates.gotmpl" \
      "${scanner_dir}/.helm-docs.gotmpl" \
      "${HELM_DOCS_DIR}/README.DockerHub-Scanner.md.gotmpl"
  else
    log "No scanner found at '${scanner_image_dir}'! Skipping scanner doc."
  fi

  log "Generating main doc..."
  generate_docs "${scanner_dir}" \
    "docs/README.ArtifactHub.md" \
    "${HELM_DOCS_DIR}/templates.gotmpl" \
    "${scanner_dir}/.helm-docs.gotmpl" \
    "${HELM_DOCS_DIR}/README.ArtifactHub.md.gotmpl"
}

function generate_hook_docs() {
  log "Generating hook docs for ${CHART_FILE}..."

  local hook_dir docs_dir

  hook_dir="$(dirname "${CHART_FILE}")"
  docs_dir="${hook_dir}/docs"

  if [ ! -d "${docs_dir}" ]; then
    log "Ignoring docs creation process for '${CHART_FILE}' because docs folder found at: '${docs_dir}'!"
    exit 0
  fi

  generate_docs "${hook_dir}" \
    "docs/README.DockerHub-Hook.md" \
    "${HELM_DOCS_DIR}/templates.gotmpl" \
    "${hook_dir}/.helm-docs.gotmpl" \
    "${HELM_DOCS_DIR}/README.DockerHub-Hook.md.gotmpl"
  generate_docs "${hook_dir}" \
    "docs/README.ArtifactHub.md" \
    "${HELM_DOCS_DIR}/templates.gotmpl" \
    "${hook_dir}/.helm-docs.gotmpl" \
    "${HELM_DOCS_DIR}/README.ArtifactHub.md.gotmpl"
}

function main() {
  validate_args

  case "${DOC_TYPE}" in
  "--scanner")
    generate_scanner_docs
    ;;
  "--hook")
    generate_hook_docs
    ;;
  *)
    error "Unsupported doc type: ${DOC_TYPE}!"
    error "${USAGE}"
    ;;
  esac
}

main
