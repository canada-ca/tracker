#!/bin/bash
set -e

# Configuration
NAMESPACE="scanners"
POD_NAME="dmarc-dev-proxy"
PROXY_PORT="3128"
TIMEOUT_MINUTES=30

# Get script directory to find the manifest
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST_PATH="$SCRIPT_DIR/dmarc-report-proxy.yaml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

cleanup() {
    log "Cleaning up..."

    # Stop port-forward if running
    if [ ! -z "$PF_PID" ]; then
        kill $PF_PID 2>/dev/null || true
        wait $PF_PID 2>/dev/null || true
    fi

    # Delete pod (ignore if already gone)
    kubectl delete pod $POD_NAME -n $NAMESPACE --ignore-not-found=true --timeout=10s

    log "Cleanup complete"
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Check if pod already exists
if kubectl get pod $POD_NAME -n $NAMESPACE &>/dev/null; then
    warn "Pod $POD_NAME already exists. Deleting it first..."
    kubectl delete pod $POD_NAME -n $NAMESPACE --timeout=30s
fi

if [ ! -f "$MANIFEST_PATH" ]; then
    error "Cannot find dmarc-report-proxy.yaml at $MANIFEST_PATH"
fi

log "Starting Cosmos DB proxy (timeout: ${TIMEOUT_MINUTES}m)..."

# Create the proxy pod
kubectl apply -f "$MANIFEST_PATH"

# Wait for pod to be ready
log "Waiting for pod to be ready..."
if ! kubectl wait --for=condition=Ready pod/$POD_NAME -n $NAMESPACE --timeout=120s; then
    error "Pod failed to become ready"
fi

# Start port-forward in background
log "Starting port-forward on localhost:$PROXY_PORT..."
kubectl port-forward pod/$POD_NAME $PROXY_PORT:$PROXY_PORT -n $NAMESPACE &
PF_PID=$!

# Wait a moment for port-forward to establish
sleep 2

# Check if port-forward is working
if ! kill -0 $PF_PID 2>/dev/null; then
    error "Port-forward failed to start"
fi

log "✅ Proxy ready at localhost:$PROXY_PORT"
log "Configure your app to use: HTTPS_PROXY=http://localhost:$PROXY_PORT"
log ""
log "The proxy will automatically stop after ${TIMEOUT_MINUTES} minutes"
log "Press Ctrl+C to stop manually"

# Wait for port-forward to exit (either by user interrupt or pod deletion)
wait $PF_PID 2>/dev/null || true

log "Port-forward stopped"
