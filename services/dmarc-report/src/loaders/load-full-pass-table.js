const loadFullPassTable =
  ({ container }) =>
  async ({ domain, date }) => {
    // Get full pass
    const { resources } = await container.items
      .query({
        query: `
          SELECT * FROM (
            SELECT
              f.source_ip_address AS sourceIpAddress,
              f.envelope_from AS envelopeFrom,
              f.header_from AS headerFrom,
              f.spf_domains AS spfDomains,
              f.dkim_domains AS dkimDomains,
              f.dkim_selectors AS dkimSelectors,
              f.total_messages AS totalMessages,
              f.dns_host AS dnsHost,
              f.cursor AS id
            FROM c JOIN f IN c.detail_tables.full_pass
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
  loadFullPassTable,
}
