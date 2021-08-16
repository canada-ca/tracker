const loadSpfFailureTable =
  ({ container }) =>
  async ({ domain, date }) => {
    // Get spf failure
    const { resources } = await container.items
      .query({
        query: `
          SELECT * FROM (
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
            AND c.id=@date
          ) AS sub
        `,
        parameters: [
          { name: '@domain', value: domain },
          { name: '@date', value: String(date) },
        ],
      })
      .fetchAll()

    return resources
  }

module.exports = {
  loadSpfFailureTable,
}
