export const rawFullPassData = {
  findDomainByDomain: {
    id: 'test-id=',
    __typename: 'Domain',
    dmarcSummaryByPeriod: {
      __typename: 'Period',
      domain: 'test-domain',
      month: 'LAST30DAYS',
      year: '2020',
      detailTables: {
        fullPass: {
          edges: [
            {
              node: {
                sourceIpAddress: '789.789.789.789',
                envelopeFrom: null,
                dkimDomains: 'test-dkim-domains',
                dkimSelectors: 'selector3',
                dnsHost: 'test-dns-host',
                headerFrom: 'test-header-from',
                spfDomains: 'test-spf-domains',
                totalMessages: 700,
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: 'end-cursor=',
            hasPreviousPage: false,
            startCursor: 'start-cursor==',
          },
        },
      },
    },
  },
}
