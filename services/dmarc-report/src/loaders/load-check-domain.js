const loadCheckDomain =
  ({ query }) =>
  async ({ domain }) => {
    const domainCursor = await query`
      FOR domain in domains
        FILTER domain.domain == ${domain}
        RETURN domain
    `

    const checkDomain = await domainCursor.next()

    return checkDomain
  }

module.exports = {
  loadCheckDomain,
}
