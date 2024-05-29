const loadDkimFailureTable =
  ({ container }) =>
  async ({ domain, date }) => {
    // Get dkim failure
    return container.items
      .query({
        query: `
        SELECT * FROM (
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
            f.cursor AS id,
            f.guidance
          FROM c JOIN f IN c.detail_tables.dkim_failure
          WHERE c.domain=@domain
          AND c.id=@date
        ) AS sub
      `,
        parameters: [
          { name: '@domain', value: domain },
          { name: '@date', value: String(date) },
        ],
      })
      .fetchAll()
  }

module.exports = {
  loadDkimFailureTable,
}
