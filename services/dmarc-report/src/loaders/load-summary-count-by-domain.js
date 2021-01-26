const loadSummaryCountByDomain = (query) => async ({ domain }) => {
  let domainCursor
  try {
    domainCursor = await query`
      LET domainId = (
          FOR domain IN domains
            FILTER domain.domain == ${domain}
            RETURN domain._id
      )

      LET edges = (
        FOR id IN domainId
          FOR v, e IN 1..1 ANY id domainsToDmarcSummaries
            RETURN e
      )

      RETURN { domainId: FIRST(domainId), summaryCount: LENGTH(edges) }
    `
  } catch (err) {
    throw new Error(err)
  }

  const edge = await domainCursor.next()

  if (edge.domainId === null) {
    console.info(`\tDomain not found in db: ${domain}`)
    return { summaryCount: undefined, domainId: undefined }
  }

  return {
    summaryCount: edge.summaryCount,
    domainId: edge.domainId,
  }
}

module.exports = {
  loadSummaryCountByDomain,
}
