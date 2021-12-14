const { Database, aql } = require('arangojs')
const path = require('path')
const crypto = require('crypto')

require('dotenv-safe').config({
  path: path.join(__dirname, '/.env'),
  example: path.join(__dirname, '/.env.example'),
})

const { DB_USERNAME, DB_PASS, DB_NAME, DB_URL, HASHING_SALT } = process.env

const saltedHash = (data, salt) => {
  const saltedData = data + salt

  return crypto.createHash('md5').update(saltedData).digest('hex')
}

;(async () => {
  const rootDb = new Database({
    url: DB_URL,
    auth: { username: DB_USERNAME, password: DB_PASS },
  })

  try {
    await rootDb.exists()
  } catch (err) {
    console.error('Error while connection to database\n', err)
    return
  }

  console.log('Successfully created database connection')

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

  const domainListCursor = await query`
    WITH domains
    FOR domain IN domains
      RETURN domain
  `

  const domainList = await domainListCursor.all()

  for (const domain of domainList) {
    const hash = saltedHash(domain.domain, HASHING_SALT)
    domain['hash'] = hash

    await query`
      WITH domains
        UPSERT { _key: ${domain._key} }
          INSERT ${domain}
          UPDATE { hash: ${hash} }
          IN domains
    `
  }

  console.log('Completed hashing domains.')
})()
