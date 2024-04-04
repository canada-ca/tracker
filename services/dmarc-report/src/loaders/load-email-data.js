const loadEmailData =
  ({ container }) =>
  async ({ domain, date }) => {
    // Get dkim failure
    return container.items
      .query({
        query: `
        select * from (
          select
            f.source_ip_address as sourceipaddress,
            f.envelope_from as envelopefrom,
            f.header_from as headerfrom,
            f.dkim_domains as dkimdomains,
            f.dkim_selectors as dkimselectors,
            f.dkim_results as dkimresults,
            f.dkim_aligned as dkimaligned,
            f.total_messages as totalmessages,
            f.dns_host as dnshost,
            f.cursor as id,
            f.guidance
          from c join f in c.detail_tables.dkim_failure
          where c.domain=@domain
          and c.id=@date
        ) as sub
      `,
        parameters: [
          { name: '@domain', value: domain },
          { name: '@date', value: String(date) },
        ],
      })
      .fetchAll()
  }

module.exports = {
  loadEmailData,
}
