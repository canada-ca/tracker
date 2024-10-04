const loadCheckDomain = async ({ arangoCtx, domain }) => {
  const domainCursor = await arangoCtx.query`
      FOR domain in domains
        FILTER domain.domain == ${domain}
        RETURN domain
    `

  return await domainCursor.next()
}

module.exports = {
  loadCheckDomain,
}
