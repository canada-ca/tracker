import { t } from '@lingui/macro'

export const checkDomainOwnership = ({ i18n, query, userKey }) => async ({
  domainId,
}) => {
  let userAffiliatedOwnership, ownership
  const userKeyString = `users/${userKey}`
  // Get user affiliations and affiliated orgs owning provided domain
  try {
    userAffiliatedOwnership = await query`
      LET userAffiliations = (FOR v, e IN 1..1 ANY ${userKeyString} affiliations RETURN e._from)
      LET domainOwnerships = (FOR v, e IN 1..1 ANY ${domainId} ownership RETURN e._from)
      LET affiliatedOwnership = INTERSECTION(userAffiliations, domainOwnerships)
        RETURN affiliatedOwnership
    `
  } catch (err) {
    console.error(
      `Database error when retrieving affiliated organization ownership for user: ${userKeyString} and the domain: ${domainId}: ${err}`,
    )
    throw new Error(
      i18n._(
        t`Error when retrieving dmarc report information. Please try again.`,
      ),
    )
  }

  try {
    ownership = await userAffiliatedOwnership.next()
  } catch (err) {
    console.error(
      `Cursor error when retrieving affiliated organization ownership for user: ${userKeyString} and the domain: ${domainId}: ${err}`,
    )
    throw new Error(
      i18n._(
        t`Error when retrieving dmarc report information. Please try again.`,
      ),
    )
  }

  return ownership[0] !== undefined
}
