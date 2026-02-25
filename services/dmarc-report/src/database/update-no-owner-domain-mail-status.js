const logger = require('../logger')

async function updateNoOwnerDomainMailStatus({ arangoCtx }) {
  logger.info('Updating no owner domain mail statuses')
  const updateNoOwnerDomainMailStatusCursor = await arangoCtx.query`
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
