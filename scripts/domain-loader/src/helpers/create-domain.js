const { saltedHash } = require('./salted-hash')

const { HASHING_SALT } = process.env

const createDomain = async ({ domain, trx, query }) => {
  console.info(`\tCreating domain: ${domain}.`)

  const domainStruct = {
    domain: domain,
    selectors: [],
    hash: saltedHash(domain, HASHING_SALT),
    status: {
      ciphers: 'info',
      curves: 'info',
      hsts: 'info',
      protocols: 'info',
      certificates: 'info',
      dkim: 'info',
      dmarc: 'info',
      https: 'info',
      spf: 'info',
      ssl: 'info',
    },
    lastRan: '',
  }

  const savedDomainCursor = await trx.step(
    () => query`
      WITH domains, claims, organizations
      INSERT ${domainStruct} INTO domains
      RETURN NEW
    `,
  )
  const savedDomain = await savedDomainCursor.next()

  return savedDomain
}

module.exports = {
  createDomain,
}
