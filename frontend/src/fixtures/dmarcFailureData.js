export const rawDmarcFailureData = {
  findDomainByDomain: {
    id: 'test-id=',
    __typename: 'Domain',
    dmarcSummaryByPeriod: {
      __typename: 'Period',
      domain: 'test-domain',
      month: 'LAST30DAYS',
      year: '2020',
      detailTables: {
        dmarcFailure: {
          edges: [
            {
              node: {
                dkimDomains: '',
                dkimSelectors: '',
                disposition: 'none',
                dnsHost: 'testDns',
                envelopeFrom: null,
                headerFrom: 'testHeader',
                sourceIpAddress: '321.321.321.321',
                spfDomains: 'testSpfDomains',
                totalMessages: 200,
              },
              __typename: 'DmarcFailureTableEdge',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: 'end-cursor=',
            hasPreviousPage: false,
            startCursor: 'start-cursor=',
            __typename: 'PageInfo',
          },
          __typename: 'DmarcFailureTableConnection',
        },
        __typename: 'DetailTables',
      },
    },
  },
}
