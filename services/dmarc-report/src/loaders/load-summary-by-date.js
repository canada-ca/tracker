const loadSummaryByDate = (container) => async ({ domain, startDate }) => {
  const summary = {}
  summary.detailTables = {}

  // Get category totals
  try {
    const { resources } = await container.items
      .query({
        query: `SELECT 
          c.category_totals.pass AS pass,
          c.category_totals.fail AS fail,
          c.category_totals['pass-dkim-only'] AS passDkimOnly,
          c.category_totals['pass-spf-only'] AS passSpfOnly
        FROM c 
        WHERE c.domain = @domain 
        AND c.id = @startDate`,
        parameters: [
          { name: '@domain', value: domain },
          { name: '@startDate', value: String(startDate) },
        ],
      })
      .fetchAll()

    if (typeof resources[0] === 'undefined') {
      summary.categoryTotals = {
        pass: 0,
        fail: 0,
        passDkimOnly: 0,
        passSpfOnly: 0,
      }
    } else {
      summary.categoryTotals = resources[0]
    }
  } catch (err) {
    throw Error(err)
  }

  // Get dkim failure
  try {
    const { resources } = await container.items
      .query({
        query: `SELECT * FROM (
        SELECT 
            f.source_ip_address AS sourceIpAddress,
            f.envelope_from AS envelopeFrom,
            f.header_from AS headerFrom,
            f.dkim_domains AS dkimDomains,
            f.dkim_selectors AS dkimSelectors,
            f.dkim_results AS dkimResults,
            f.dkim_aligned AS dkimAligned,
            f.total_messages AS totalMessages,
            f.dns_host AS dnsHost,
            f.guidance
        FROM c JOIN f IN c.detail_tables.dkim_failure
        WHERE c.domain=@domain
        AND c.id=@startDate) AS sub`,
        parameters: [
          { name: '@domain', value: domain },
          { name: '@startDate', value: String(startDate) },
        ],
      })
      .fetchAll()

    summary.detailTables.dkimFailure = resources
  } catch (err) {
    throw Error(err)
  }

  // Get dmarc failure
  try {
    const { resources } = await container.items
      .query({
        query: `SELECT * FROM (
        SELECT 
          f.source_ip_address AS sourceIpAddress,
          f.envelope_from AS envelopeFrom,
          f.header_from AS headerFrom,
          f.spf_domains AS spfDomains,
          f.dkim_domains AS dkimDomains,
          f.dkim_selectors AS dkimSelectors,
          f.disposition,
          f.total_messages AS totalMessages,
          f.dns_host AS dnsHost
        FROM c JOIN f IN c.detail_tables.dmarc_failure
        WHERE c.domain=@domain
        AND c.id=@startDate) AS sub`,
        parameters: [
          { name: '@domain', value: domain },
          { name: '@startDate', value: String(startDate) },
        ],
      })
      .fetchAll()

    summary.detailTables.dmarcFailure = resources
  } catch (err) {
    throw Error(err)
  }

  // Get full pass
  try {
    const { resources } = await container.items
      .query({
        query: `SELECT * FROM (
        SELECT
          f.source_ip_address AS sourceIpAddress,
          f.envelope_from AS envelopeFrom,
          f.header_from AS headerFrom,
          f.spf_domains AS spfDomains,
          f.dkim_domains AS dkimDomains,
          f.dkim_selectors AS dkimSelectors,
          f.total_messages AS totalMessages,
          f.dns_host AS dnsHost
        FROM c JOIN f IN c.detail_tables.full_pass
        WHERE c.domain=@domain
        AND c.id=@startDate) AS sub`,
        parameters: [
          { name: '@domain', value: domain },
          { name: '@startDate', value: String(startDate) },
        ],
      })
      .fetchAll()

    summary.detailTables.fullPass = resources
  } catch (err) {
    throw Error(err)
  }

  // Get spf failure
  try {
    const { resources } = await container.items
      .query({
        query: `SELECT * FROM (
        SELECT 
          f.source_ip_address AS sourceIpAddress,
          f.envelope_from AS envelopeFrom,
          f.header_from AS headerFrom,
          f.spf_domains AS spfDomains,
          f.spf_results AS spfResults,
          f.spf_aligned AS spfAligned,
          f.total_messages AS totalMessages,
          f.cursor AS id,
          f.dns_host AS dnsHost,
          f.guidance
        FROM c JOIN f IN c.detail_tables.spf_failure
        WHERE c.domain=@domain
        AND c.id=@startDate) AS sub`,
        parameters: [
          { name: '@domain', value: domain },
          { name: '@startDate', value: String(startDate) },
        ],
      })
      .fetchAll()

    summary.detailTables.spfFailure = resources
  } catch (err) {
    throw Error(err)
  }

  return summary
}

module.exports = {
  loadSummaryByDate,
}
