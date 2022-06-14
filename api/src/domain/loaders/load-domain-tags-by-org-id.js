import { t } from '@lingui/macro'

export const loadDomainTagsByOrgId =
  ({ query, userKey, i18n, _auth }) =>
  async ({ orgId }) => {
    let requestedTagsInfo
    try {
      requestedTagsInfo = await query`
      LET domainKeys = (
        FOR v, e IN 1..1 OUTBOUND ${orgId} claims
          OPTIONS {bfs: true}
          RETURN v._key
      )
      LET orgTags = UNIQUE(
        FOR d in domains
            FILTER d._key in domainKeys
            FOR tag in d.tags
                RETURN { id: tag.id, severity: tag.severity }
      )
      RETURN { "tags": orgTags, "totalCount": LENGTH(orgTags) }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather domains in loadDomainTagsByOrgId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain(s). Please try again.`))
    }

    let tagsInfo
    try {
      tagsInfo = await requestedTagsInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather domainTags in loadDomainTagsByOrgId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain(s). Please try again.`))
    }

    console.log('info: ', tagsInfo.tags)

    if (tagsInfo.tags.length === 0) {
      return {
        edges: [],
        totalCount: 0,
      }
    }

    const edges = tagsInfo.tags.map((tag) => {
      return tag
    })

    return {
      edges,
      totalCount: tagsInfo.totalCount,
    }
  }
