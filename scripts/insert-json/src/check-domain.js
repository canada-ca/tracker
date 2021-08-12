const checkDomain = async ({ domain, query }) => {
  console.info(`\tChecking domain: ${domain}.`)

  const domainCursor = await query`
    WITH domains
    FOR domain IN domains
      FILTER domain.domain == ${domain}
      RETURN domain
  `

  const checkedDomain = await domainCursor.next()

  return checkedDomain
}

module.exports = {
  checkDomain,
}
