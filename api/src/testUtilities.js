import { ensure } from 'arango-tools'
import { Database } from 'arangojs'

export const ensureDatabase = async ({ variables, schema }) => {
  const systemDatabase = new Database({ url: variables.url, databaseName: '_system' })
  await systemDatabase.login('root', variables.rootPassword)
  const databases = await systemDatabase.listDatabases()
  if (!databases.includes(variables.dbname)) {
    try {
      await systemDatabase.createDatabase(variables.dbname, {
        users: [
          {
            username: variables.username,
            passwd: variables.password,
            active: true,
          },
        ],
      })
    } catch (e) {
      console.error(`Failed to create database ${variables.dbname}: ${e.message}`)
      process.exit(1)
    }
  }

  return await ensure({
    variables,
    schema,
  })
}
