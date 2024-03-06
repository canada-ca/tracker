const { Database, aql } = require('arangojs')
const { ensure } = require('arango-tools')
const { databaseOptions } = require('../../database-options')

const arangoConnection = async ({ url, databaseName, rootPass }) => {
  await ensure({
    type: 'database',
    name: databaseName,
    url,
    rootPassword: rootPass,
    options: databaseOptions({ rootPass }),
  })

  const arangoDB = new Database({
    url,
    databaseName,
    auth: {
      username: 'root',
      password: rootPass,
    },
  })

  const collections = (await arangoDB.collections()).reduce((acc, collection) => {
    return {
      ...acc,
      [collection._name]: collection,
    }
  }, {})
  const query = async (strings, ...vars) => {
    return arangoDB.query(aql(strings, ...vars), {
      count: true,
    })
  }
  const transaction = async (collectionStrings) => {
    return arangoDB.beginTransaction(collectionStrings)
  }

  const truncate = async () => {
    for (const collection of Object.values(collections)) {
      await collection.truncate()
    }
  }

  return { arangoDB, collections, query, transaction, truncate }
}

module.exports = { arangoConnection }
