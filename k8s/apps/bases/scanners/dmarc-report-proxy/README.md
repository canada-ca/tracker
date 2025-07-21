# DMARC Report Proxy

Development proxy for accessing Cosmos DB from local development environments.

## Overview

This proxy allows local clients to connect to the Cosmos DB instance by routing traffic through a pod running in a Kubernetes cluster with allowlisted IP access.

## Quick Start

### 1. Start the Proxy

```bash
# Navigate to this directory
cd k8s/apps/bases/scanners/dmarc-report-proxy

# Start the proxy (will auto-cleanup after 30 minutes)
./start-proxy.sh
```

The script will:
- Delete any existing proxy pod to ensure a clean start
- Create a new proxy pod with 30 minute timeout
- Wait for the pod to be ready
- Start port-forwarding to `localhost:3128`
- Display ready message

### 2. Configure the Service

Add the following to your `.env` file in `services/dmarc-report/`:

```env
COSMOS_PROXY_URL=http://localhost:3128
```

### 3. Run DMARC Report Service

```bash
cd services/dmarc-report
npm start
```

The service should be able to connect to Cosmos DB through the proxy.

## Cleanup

The proxy will automatically shut down after 30 minutes due to the `activeDeadlineSeconds` setting. You can also manually stop it by pressing `Ctrl+C` in the terminal running the script.

## Browser Access (Optional)

If you need to access the Cosmos DB portal through the proxy (e.g., for viewing documents in the browser), you can configure FoxyProxy in Firefox.

### FoxyProxy Setup

You can configure FoxyProxy using **either** of the following methods:

#### **Option A: Import Settings (Recommended)**

1. Install the **FoxyProxy** extension in Firefox  
2. Open the FoxyProxy Options page  
3. Import the `FoxyProxy-Cosmos-Settings.json` file included in this repo

> This import will automatically configure the proxy and URL patterns.

---

#### **Option B: Manual Setup**

1. Install the **FoxyProxy** extension in Firefox  
2. Open the FoxyProxy Options page
3. Navigate to the **"Proxies"** tab
4. Click **"Add"** and configure:
   - **Title**: `Cosmos DB Proxy`
   - **Proxy Type**: `HTTP`
   - **IP Address**: `127.0.0.1`
   - **Port**: `3128`
5. Click the (+) next to **"Proxy by Patterns"**, add:
   - `*.documents.azure.com*` (Wildcard)
   - `*.cosmos.azure.com*` (Wildcard)

---

#### Final Step (Required for Both Methods)

After importing or manually creating the proxy:

1. Click the **FoxyProxy browser extension icon**
2. Select **"Proxy by Patterns"**

> This ensures that only Cosmos DB traffic is sent through the proxy. All other traffic will bypass the proxy and connect directly.

---

This setup allows you to securely access Cosmos DB in the browser without interfering with other web traffic.
