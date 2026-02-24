const logger = require('../logger')

async function createOwnership({ arangoCtx, domain, orgAcronymEn }) {
  // Generate list of collections names
  const collectionStrings = Object.keys(arangoCtx.collections)

  // setup Transaction
  const trx = await arangoCtx.transaction(collectionStrings)

  try {
    await trx.step(
      () => arangoCtx.query`
      WITH domains, organizations, ownership
      LET domainId = FIRST(
        FOR domain IN domains
          FILTER domain.domain == ${domain}
          RETURN domain._id
      )
      LET orgId = FIRST(
        FOR org IN organizations
          FILTER org.orgDetails.en.acronym == ${orgAcronymEn}
          RETURN org._id
      )
      INSERT {
        _from: orgId,
        _to: domainId,
      } INTO ownership
    `,
    )
  } catch (err) {
    logger.error({ err }, 'Transaction step error occurred for dmarc summaries service when creating ownership data')
    await trx.abort()
  }

  try {
    await trx.commit()
  } catch (err) {
    logger.error({ err }, 'Transaction commit error occurred for dmarc summaries service when creating ownership data')
    await trx.abort()
  }
}

module.exports = {
  createOwnership,
}
