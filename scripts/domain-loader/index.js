const { Database, aql } = require('arangojs')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const { addOrganizationsDomains, alignOrganizationsDomains } = require('./src')

const path = require('path')
require('dotenv-safe').config({
  path: path.join(__dirname, '/.env'),
  example: path.join(__dirname, '/.env.example'),
})

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
    '$0 add',
    'add new organizations and domains to the database from a JSON file',
  )
  .demandCommand(
    1,
    1,
    'You must include the command you wish to run.',
    'You must include the command you wish to run.',
  )
  .help('h')
  .alias('h', 'help')
  .version(false).argv

if (!['add', 'align'].includes(argv._[0])) {
  console.error('Incorrect command entered, use "node index.js -h" for help.')
  process.exit(-1)
}

const { FILE, DB_USERNAME, DB_PASS, DB_URL, DB_NAME } = process.env

;(async () => {
  let data
  try {
    data = require(FILE)
  } catch (err) {
    console.error(err)
    return
  }

  const rootDb = new Database({
    url: DB_URL,
    auth: { username: DB_USERNAME, password: DB_PASS },
  })

  try {
    await rootDb.exists()
  } catch (err) {
    console.error('Error while connecting to database\n', err)
    return
  }

  console.log('Successfully created database connection')

  // check if database exists
  const databaseExists = (await rootDb.listDatabases()).includes(DB_NAME)
  // create database if it does not exist
  if (!databaseExists) {
    console.log(`Database does not exist, creating database "${DB_NAME}"`)
    await rootDb.createDatabase(DB_NAME)
  } else {
    console.log(`Database ${DB_NAME} already exists`)
  }
  const db = rootDb.database(DB_NAME)
  db.useBasicAuth(DB_USERNAME, DB_PASS)

  console.log(`Using database "${DB_NAME}"`)

  const query = async function query(strings, ...vars) {
    return db.query(aql(strings, ...vars), {
      count: true,
    })
  }

  switch (argv._[0]) {
    case 'add':
      console.log(
        `Adding domains and organizations from "${FILE}" to "${DB_NAME}"`,
      )
      await addOrganizationsDomains({ db: db, query, data })
      break
    case 'align':
      console.log(
        `Aligning domains and organizations in "${DB_NAME}" with ${FILE}`,
      )
      await alignOrganizationsDomains({ db: db, query, data })
      break
  }
})()
