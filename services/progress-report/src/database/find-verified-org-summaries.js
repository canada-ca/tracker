const { aql } = require('arangojs')
const { UNCLAIMED_ORG_ID } = process.env

const findVerifiedOrgs = async ({ query }) => {
  let unclaimedFilter = aql``
  if (typeof UNCLAIMED_ORG_ID !== 'undefined') unclaimedFilter = aql`FILTER org._id != ${UNCLAIMED_ORG_ID}`
  let cursor
  try {
    cursor = await query`
        FOR org IN organizations
          FILTER org.verified == true
          ${unclaimedFilter}
          RETURN { _key: org._key, _id: org._id, orgDetails: org.orgDetails, summaries: org.summaries }
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find verified orgs: ${err}`)
  }

  let verifiedOrgs
  try {
    verifiedOrgs = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find verified orgs: ${err}`)
  }

  return verifiedOrgs
}

const findOrgSummaries = async ({ log, query, startDate }) => {
  const verifiedOrgs = await findVerifiedOrgs({ query })
  const orgSummaries = {}
  for (const org of verifiedOrgs) {
    const { _key, _id, orgDetails, summaries } = org
    // get 30 days previous
    let cursor
    try {
      cursor = await query`
        FOR os IN organizationSummaries
          FILTER os.organization == ${org._id}
          FILTER DATE_FORMAT(os.date, '%yyyy-%mm-%dd') >= DATE_FORMAT(${startDate}, '%yyyy-%mm-%dd')
          SORT os.date ASC
          LIMIT 1
          RETURN os
      `
    } catch (err) {
      throw new Error(`Database error occurred while trying to find org summaries: ${err}`)
    }

    let orgSummary
    try {
      orgSummary = await cursor.next()
    } catch (err) {
      throw new Error(`Cursor error occurred while trying to find org summaries: ${err}`)
    }

    orgSummaries[_key] = {
      _id,
      orgDetails,
      endSummary: summaries,
      startSummary: orgSummary,
    }
  }

  log(`Successfully found ${Object.keys(orgSummaries).length} verified org summaries`)
  return orgSummaries
}

module.exports = {
  findOrgSummaries,
}
