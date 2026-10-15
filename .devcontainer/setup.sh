#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
git rev-parse --show-toplevel > /dev/null

ROOTS=(api frontend database-migration scanners services azure-defender-easm)
EXCLUDE='log4shell|spring4shell'

tracked() {
  git ls-files "${ROOTS[@]}" | grep -E "(^|/)$1\$" | grep -vE "$EXCLUDE" | xargs -n1 dirname
}

echo ">>> .env files"
python3 .devcontainer/write_env_files.py $(tracked '\.env\.example')

dockerfile_python_version() {
  [ -f "$1/Dockerfile" ] || return 0
  grep -m1 -oE '^FROM python:[0-9]+(\.[0-9]+)*' "$1/Dockerfile" | cut -d: -f2 || true
}

for dir in $(tracked requirements.txt); do
  python_version=$(dockerfile_python_version "$dir")
  echo ">>> [$dir] Python ${python_version:-from image} venv"
  uv venv --quiet --clear --python "${python_version:-$(command -v python3)}" "$dir/.venv"
  uv pip install --quiet --python "$dir/.venv" -r "$dir/requirements.txt"
done

uv pip install --quiet --python scanners/dns-scanner/.venv pytest

for dir in $(tracked package-lock.json); do
  echo ">>> [$dir] npm ci"
  (cd "$dir" && npm ci --no-audit --no-fund --loglevel=error)
done

echo ">>> [scanners/findings-processor] go mod download"
(cd scanners/findings-processor && go mod download)

echo ">>> [scanners/web-scanner] CRLite database update"
(cd scanners/web-scanner && rust-query-crlite --update prod x509)
