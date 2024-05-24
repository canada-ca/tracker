const updateDomainMailStatus =
  ({ query }) =>
  async ({ domain, sendsEmail }) => {
    const updateDomainMailStatusCursor = await query`
      FOR domain IN domains
        FILTER domain.domain == ${domain}
        UPDATE domain WITH { sendsEmail: ${sendsEmail} } IN domains
    `

    await updateDomainMailStatusCursor.next()
  }

module.exports = {
  updateDomainMailStatus,
}
