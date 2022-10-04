import 'dotenv-safe/config'
import { Database, aql } from 'arangojs'
import { Server } from './src/server'
import { createContext } from './src/create-context'
import { createI18n } from './src/create-i18n'
import { connect, JSONCodec } from 'nats'

const {
  PORT = 4000,
  DB_PASS: rootPass,
  DB_URL: url,
  DB_NAME: databaseName,
  DEPTH_LIMIT: maxDepth,
  COST_LIMIT: complexityCost,
  SCALAR_COST: scalarCost,
  OBJECT_COST: objectCost,
  LIST_FACTOR: listFactor,
  TRACING_ENABLED: tracing,
  HASHING_SALT,
  LOGIN_REQUIRED = 'true',
  NATS_URL,
} = process.env

const collections = [
  'users',
  'organizations',
  'domains',
  'dkim',
  'dkimResults',
  'dmarc',
  'spf',
  'https',
  'ssl',
  'dkimGuidanceTags',
  'dmarcGuidanceTags',
  'spfGuidanceTags',
  'httpsGuidanceTags',
  'sslGuidanceTags',
  'chartSummaries',
  'dmarcSummaries',
  'aggregateGuidanceTags',
  'scanSummaryCriteria',
  'chartSummaryCriteria',
  'scanSummaries',
  'affiliations',
  'claims',
  'domainsDKIM',
  'dkimToDkimResults',
  'domainsDMARC',
  'domainsSPF',
  'domainsHTTPS',
  'domainsSSL',
  'ownership',
  'domainsToDmarcSummaries',
  'auditLogs',
]

;(async () => {
  const db = new Database({
    url,
    databaseName,
    auth: { username: 'root', password: rootPass },
  })

  const query = async function query(strings, ...vars) {
    return db.query(aql(strings, ...vars), {
      count: true,
    })
  }

  const transaction = async function transaction(collections) {
    return db.beginTransaction(collections)
  }

  const nc = await connect({ servers: NATS_URL })

  const jsm = await nc.jetstreamManager()

  await jsm.streams.add({ name: 'domains', subjects: ['domains.*'] })

  // create a jetstream client:
  const js = nc.jetstream()

  // eslint-disable-next-line new-cap
  const jc = JSONCodec()

  const publish = async ({ channel, msg }) => {
    await js.publish(channel, jc.encode(msg))
  }

  const server = await Server({
    context: async ({ req, res, connection }) => {
      if (connection) {
        // XXX: assigning over req?
        req = {
          headers: {
            authorization: connection.authorization,
          },
          language: connection.language,
        }
      }
      const i18n = createI18n(req.language)
      return createContext({
        query,
        transaction,
        collections,
        publish,
        req,
        res,
        i18n,
        loginRequiredBool: LOGIN_REQUIRED === 'true', // bool not string
        salt: HASHING_SALT,
      })
    },
    maxDepth,
    complexityCost,
    scalarCost,
    objectCost,
    listFactor,
    tracing,
  })

  console.log(
    `Starting server with "LOGIN_REQUIRED" set to "${LOGIN_REQUIRED}"`,
  )

  await server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`)
  })
})()
