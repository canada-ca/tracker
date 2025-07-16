const { CosmosClient } = require('@azure/cosmos')
const { HttpsProxyAgent } = require('https-proxy-agent')

const { AZURE_CONN_STRING, COSMOS_PROXY_URL } = process.env

function parseConnectionString(connectionString) {
  const params = {}
  connectionString.split(';').forEach((part) => {
    const [key, value] = part.split('=')
    if (key && value) {
      params[key.trim()] = value.trim()
    }
  })
  return params
}

function createCosmosClient() {
  const connectionString = AZURE_CONN_STRING
  const proxyUrl = COSMOS_PROXY_URL

  if (!connectionString) {
    throw new Error('AZURE_CONN_STRING environment variable is required')
  }

  const parsed = parseConnectionString(connectionString)

  const config = {
    endpoint: parsed.AccountEndpoint,
    key: parsed.AccountKey,
  }

  if (proxyUrl) {
    config.agent = new HttpsProxyAgent(proxyUrl)
  }

  return new CosmosClient(config)
}

module.exports = { createCosmosClient }
