import {t} from '@lingui/macro'

export const checkDomainOwnership = ({
                                       i18n,
                                       query,
                                       userKey,
                                       auth: {loginRequiredBool},
                                     }) => async ({domainId}) => {
  let userAffiliatedOwnership, ownership
  const userKeyString = `users/${userKey}`

  // Check to see if the user is a super admin
  let superAdminAffiliationCursor
  try {
    superAdminAffiliationCursor = await query`
      WITH affiliations, organizations, users
      LET domainOwnerships = (FOR v, e IN 1..1 ANY ${domainId} ownership RETURN e._from)
      LET superAdmin = (
        FOR v, e IN 1..1 ANY ${userKeyString} affiliations
          FILTER e.permission == "super_admin"
          RETURN e.from
      )
      RETURN {
        domainOwnership: (LENGTH(domainOwnerships) > 0 ? true : false),
        superAdmin: (LENGTH(superAdmin) > 0 ? true : false)
      }
    `
  } catch (err) {
    console.error(
      `Database error when retrieving super admin affiliated organization ownership for user: ${userKey} and domain: ${domainId}: ${err}`,
    )
    throw new Error(
      i18n._(t`Ownership check error. Unable to request domain information.`),
    )
  }

  let superAdminAffiliation
  try {
    superAdminAffiliation = await superAdminAffiliationCursor.next()
  } catch (err) {
    console.error(
      `Cursor error when retrieving super admin affiliated organization ownership for user: ${userKey} and domain: ${domainId}: ${err}`,
    )
    throw new Error(
      i18n._(t`Ownership check error. Unable to request domain information.`),
    )
  }

  if (superAdminAffiliation.superAdmin || !loginRequiredBool) {
    return !!superAdminAffiliation.domainOwnership
  }

  // Get user affiliations and affiliated orgs owning provided domain
  try {
    userAffiliatedOwnership = await query`
      WITH affiliations, domains, organizations, ownership, users
      LET userAffiliations = (FOR v, e IN 1..1 ANY ${userKeyString} affiliations RETURN e._from)
      LET domainOwnerships = (FOR v, e IN 1..1 ANY ${domainId} ownership RETURN e._from)
      LET affiliatedOwnership = INTERSECTION(userAffiliations, domainOwnerships)
        RETURN affiliatedOwnership
    `
  } catch (err) {
    console.error(
      `Database error when retrieving affiliated organization ownership for user: ${userKey} and domain: ${domainId}: ${err}`,
    )
    throw new Error(
      i18n._(t`Ownership check error. Unable to request domain information.`),
    )
  }

  try {
    ownership = await userAffiliatedOwnership.next()
  } catch (err) {
    console.error(
      `Cursor error when retrieving affiliated organization ownership for user: ${userKey} and domain: ${domainId}: ${err}`,
    )
    throw new Error(
      i18n._(t`Ownership check error. Unable to request domain information.`),
    )
  }

  return ownership[0] !== undefined
}
