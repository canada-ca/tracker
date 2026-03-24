#!/usr/bin/env bash
set -euo pipefail

# The script lives at .devcontainer/scanners/setup.sh — two dirs up is the repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCANNERS_DIR="$REPO_ROOT/scanners"

# ---------------------------------------------------------------------------
# NATS CLI — useful for publishing test messages and inspecting streams
# ---------------------------------------------------------------------------
echo ">>> Installing NATS CLI..."
NATS_VERSION="0.2.2"
ARCH="$(dpkg --print-architecture)"  # amd64 or arm64
curl -fsSL "https://github.com/nats-io/natscli/releases/download/v${NATS_VERSION}/nats-${NATS_VERSION}-linux-${ARCH}.zip" \
  -o /tmp/nats.zip
unzip -q /tmp/nats.zip -d /tmp/nats
sudo mv /tmp/nats/nats-*/nats /usr/local/bin/nats
rm -rf /tmp/nats /tmp/nats.zip
echo "    nats $(nats --version)"

# ---------------------------------------------------------------------------
# pyenv — install if not already present, then bootstrap for this session.
# Each scanner service pins its own Python version in its Dockerfile; we
# use pyenv to create isolated venvs per service without touching system Python.
# ---------------------------------------------------------------------------
export PYENV_ROOT="$HOME/.pyenv"
if [ ! -x "$PYENV_ROOT/bin/pyenv" ]; then
  echo ">>> Installing build dependencies..."
  # Required to compile CPython (pyenv) and native Python extensions (e.g. pydantic-core)
  sudo apt-get update -qq
  sudo apt-get install -y -qq \
    build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev \
    libsqlite3-dev libffi-dev liblzma-dev libncurses-dev

  echo ">>> Installing Rust (required for pydantic-core and other native extensions)..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path
  # Source immediately so cargo is available for the rest of this block
  source "$HOME/.cargo/env"

  echo ">>> Installing pyenv..."
  curl -fsSL https://pyenv.run | bash

  echo ">>> Installing rust-query-crlite (used by web-scanner for TLS revocation checks)..."
  cargo install \
    --git https://github.com/mozilla/crlite rust-query-crlite \
    --rev dcb8a4d \
    --features=rustls/dangerous_configuration
fi

# Make Rust and pyenv available for this session
export PATH="$HOME/.cargo/bin:$PATH"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init --path)"

# Map service → Python version (sourced from each service's Dockerfile)
declare -A SERVICE_PYTHON=(
  [dns-scanner]="3.13.5"
  [dns-processor]="3.14.2"
  [web-scanner]="3.12.8"
  [web-processor]="3.14.2"
)

for service in "${!SERVICE_PYTHON[@]}"; do
  version="${SERVICE_PYTHON[$service]}"
  svc_dir="$SCANNERS_DIR/$service"

  echo ">>> [$service] Setting up Python $version venv..."

  # Install the version if pyenv doesn't have it yet.
  # --enable-shared is required for maturin/pyo3 (e.g. pydantic-core) to link
  # against libpython. Without it, maturin ignores the venv and falls back to
  # the system Python, causing version mismatches and build failures.
  if ! pyenv versions --bare | grep -qx "$version"; then
    PYTHON_CONFIGURE_OPTS="--enable-shared" pyenv install "$version"
  fi

  # Create venv using the pinned version
  "$PYENV_ROOT/versions/$version/bin/python" -m venv "$svc_dir/.venv"

  # Install dependencies
  "$svc_dir/.venv/bin/pip" install --quiet --upgrade pip
  "$svc_dir/.venv/bin/pip" install --quiet -r "$svc_dir/requirements.txt"

  # Copy .env.example → .env if no .env exists yet
  if [ ! -f "$svc_dir/.env" ] && [ -f "$svc_dir/.env.example" ]; then
    cp "$svc_dir/.env.example" "$svc_dir/.env"
    echo "    Copied .env.example → .env (fill in secrets before running)"
  fi

  echo "    Done."
done

echo ""
echo "Setup complete. Tips:"
echo "  • cd into a service directory and activate its venv:  source .venv/bin/activate"
echo "  • Run the service:                                    python service.py"
echo "  • Publish a test scan request via NATS CLI:"
echo "      nats pub --server nats://nats:4222 scans.requests '{\"domain\": \"example.com\"}'"
echo "  • Inspect the SCANS stream:"
echo "      nats stream info SCANS --server nats://nats:4222"
