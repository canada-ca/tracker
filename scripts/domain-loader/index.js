const { Database, aql } = require('arangojs')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const path = require('path')
require('dotenv-safe').config({
  path: path.join(__dirname, '/.env'),
  example: path.join(__dirname, '/.env.example'),
})

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
    '$0 add',
    'add new organizations and domains to the database from a JSON file',
  )
  .help('h')
  .alias('h', 'help')
  .version(false).argv

const {
  FILE,
  DB_PASS: rootPass,
  DB_URL: url,
  DB_NAME: databaseName,
} = process.env

;(async () => {
  let data
  try {
    data = require(FILE)
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

  try {
    await db.exists()
  } catch (err) {
    console.error('Error while checking if database exists\n', err)
  }

  switch (argv._[0]) {
    case 'add':
      await addOrganizationsDomains({ db, query, data })
      break
    case 'align':
      await alignOrganizationsDomains({ db, query, data })
      break
  }
})()
