const createDomain = async ({ domain, trx, query }) => {
  console.info(`\tCreating domain: ${domain}.`)
  
  const domainStruct = {
    domain: domain,
    selectors: [],
    status: {
      dkim: 'fail',
      dmarc: 'fail',
      https: 'fail',
      spf: 'fail',
      ssl: 'fail',
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
