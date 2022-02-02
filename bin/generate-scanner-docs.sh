#!/usr/bin/env bash

set -euo pipefail

USAGE="$(basename "${0}") path/to/scanner/Chart.yaml path/to/.helm-docs"
CHART_FILE="${1}"
HELM_DOCS_DIR="${2}"

if [[ -z "${CHART_FILE}" ]]; then
  echo >&2 "No chart file file given as first parameter!"
  echo >&2 "${USAGE}"
  exit 1
fi

if [[ -z "${HELM_DOCS_DIR}" ]]; then
  echo >&2 "No helm docs dir given as second parameter!"
  echo >&2 "${USAGE}"
  exit 1
fi

function generate_docs() {
  local output_file base_template docs_template dockerhub_template
  output_file="${1}"
  base_template="${2}"
  docs_template="${3}"
  dockerhub_template="${4}"
  helm-docs --template-files="${base_template}" \
          --template-files="${docs_template}" \
          --template-files="${dockerhub_template}" \
          --output-file="${output_file}"
}

function main() {
  echo "Generating docs for ${CHART_FILE}..."

  local scanner_dir docs_dir parser_dir sub_scanner_dir

  scanner_dir="$(dirname "${CHART_FILE}")"
  docs_dir="${scanner_dir}/docs"
  parser_dir="${scanner_dir}/parser"
  sub_scanner_dir="${scanner_dir}/scanner"

  if [ ! -d "${docs_dir}" ]; then
    echo "Ignoring docs creation process for ${CHART_FILE} because docs folder found at: ${docs_dir}"
    exit 0
  fi

  if [ -d "${parser_dir}" ]; then
    echo "Parser found at: ${parser_dir}"

    cd "${dir}" && generate_docs "${docs_dir}/README.DockerHub-Parser.md" \
      "${HELM_DOCS_DIR}/templates.gotmpl" \
      "${scanner_dir}/.helm-docs.gotmpl" \
      "${HELM_DOCS_DIR}/README.DockerHub-Parser.md.gotmpl"
  else
    echo "No parser found!"
  fi

  if [ -d "${sub_scanner_dir}" ]; then
    echo "Scanner found at: '${sub_scanner_dir}'..."

    cd "${dir}" && generate_docs "${docs_dir}/README.DockerHub-Scanner.md" \
      "${HELM_DOCS_DIR}/templates.gotmpl" \
      "${scanner_dir}/.helm-docs.gotmpl" \
      "${HELM_DOCS_DIR}/README.DockerHub-Scanner.md.gotmpl"
  else
    echo "No scanner found!"
  fi

  cd "${dir}" && generate_docs "${docs_dir}/README.ArtifactHub.md" \
    "${HELM_DOCS_DIR}/templates.gotmpl" \
    "${scanner_dir}/.helm-docs.gotmpl" \
    "${HELM_DOCS_DIR}/README.ArtifactHub.md.gotmpl"
}

main
