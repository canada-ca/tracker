const loadSummaryCountByDomain = (query) => async ({ domain }) => {
  let domainCursor
  try {
    domainCursor = await query`
      LET domainId = (
          FOR domain IN domains
            FILTER domain.domain == ${domain}
            RETURN domain._id
      )

      FOR id IN domainId
        FOR v, e IN 1..1 ANY id domainsToDmarcSummaries
        RETURN e
        
    `
  } catch (err) {
    throw new Error(err)
  }

  const edge = await domainCursor.next()

  if (typeof edge === 'undefined') {
    console.log(`Domain not found in db: ${domain}`)
    return { summaryCount: undefined, domainId: undefined }
  }

  return {
    summaryCount: domainCursor.count,
    domainId: edge._from,
  }
}

module.exports = {
  loadSummaryCountByDomain,
}
