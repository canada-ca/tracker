const updateNoOwnerDomainMailStatus =
  ({ query }) =>
  async () => {
    console.info(`Updating no owner domain mail statuses`)
    const updateNoOwnerDomainMailStatusCursor = await query`
      FOR domain IN domains
          LET ownerships = (
              FOR v,e IN 1 INBOUND domain._id ownership
                  LIMIT 1
                  RETURN e
          )
          FILTER LENGTH(ownerships) == 0
          UPDATE domain WITH { sendsEmail: "unknown" } IN domains
    `

    await updateNoOwnerDomainMailStatusCursor.next()
  }

module.exports = {
  updateNoOwnerDomainMailStatus,
}
