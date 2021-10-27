require('dotenv-safe').config()

const { Database, aql } = require('arangojs')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const { addOrganizationsDomains, alignOrganizationsDomains } = require('./src')

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <command> [options]')
  .command(
    'add',
    'Add organizations and domains to the database from a JSON file',
  )
  .command(
    'align',
    'Add and remove organizations and domains to align with a JSON file',
  )
  .example(
    '$0 add -f ./organization-domains.json',
    'add new organizations and domains to the database from the given JSON file',
  )
  .alias('f', 'file')
  .nargs('f', 1)
  .describe(
    'f',
    'Structured JSON file containing list of organizations and their domains',
  )
  .demandOption(['f'])
  .help('h')
  .alias('h', 'help')
  .version(false).argv

const { DB_PASS: rootPass, DB_URL: url, DB_NAME: databaseName } = process.env

;(async () => {
  let data
  try {
    data = require(argv.file)
  } catch (err) {
    console.error(err)
    return
  }

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

  switch (argv._) {
    case 'add':
      addOrganizationsDomains({ db, query, data })
      break
    case 'align':
      alignOrganizationsDomains({ db, query, data })
  }
})()
