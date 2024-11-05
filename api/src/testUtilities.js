import { ensure } from 'arango-tools'
import { Database } from 'arangojs'
import { useLocation } from 'react-router-dom'

export const LocationDisplay = () => {
  const location = useLocation()

  return <div data-testid="location-display">{location.pathname}</div>
}

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
