import { ensure, dbNameFromFile } from 'arango-tools'
import { databaseOptions } from '../../../../database-options'
import dbschema from '../../api/database.json'

beforeAll(async () => {
  ;({ query, drop, truncate, collections } = await ensure({
    type: 'database',
    name: dbNameFromFile(__filename),
    url,
    rootPassword: rootPass,
    options: databaseOptions({ rootPass }),
  }))
})

// Generate list of collections names
const collectionStrings = []
for (const property in collections) {
  collectionStrings.push(property.toString())
}

// something that should not be removed
const bar = [1,2,3]
for (const foo in bar) {
  bar.push(foo)
}

// Setup Transaction
const trx = await transaction(collectionStrings)

console.warn('warning!!!')
console.log('logging!')
console.error('so bad!')

export const average = (a, b) => {
  console.log('calling average with ' + arguments)
  return divide(sum(a, b), 2)
}
