import { ensure } from 'arango-tools'
import { Database } from 'arangojs'
import { tokenize } from './auth'
import { createContext } from './create-context'

export async function ensureDatabase(options) {
  let variables
  if (options.variables) {
    variables = options.variables
    variables.name = variables.dbname
  } else {
    variables = { ...options }
  }
  const systemDatabase = new Database({ url: variables.url, databaseName: '_system' })
  await systemDatabase.login('root', variables.rootPassword)
  const databases = await systemDatabase.listDatabases()
  if (!databases.includes(variables.name)) {
    try {
      await systemDatabase.createDatabase(variables.name)
    } catch (e) {
      console.error(`Failed to create database ${variables.name}: ${e.message}`)
      process.exit(1)
    }
  }

  let ensureOptions
  if (options.variables) {
    ensureOptions = {
      variables: options.variables,
      schema: { ...options.schema },
    }
  } else {
    ensureOptions = options
  }

  return await ensure(ensureOptions)
}

export function createUserContextGenerator({ query, db, transaction, collectionNames, i18n, secret, salt }) {
  return async function createUserContext({ userKey, expiry = '60m', language = 'en', loginRequiredBool = true }) {
    const signedToken = tokenize({
      expiresIn: expiry,
      parameters: { userKey: userKey },
      secret: secret,
    })
    return await createContext({
      query,
      db,
      transaction,
      collections: collectionNames,
      req: { headers: { authorization: signedToken } },
      i18n,
      language: language,
      loginRequiredBool: loginRequiredBool,
      salt: salt,
    })
  }
}
