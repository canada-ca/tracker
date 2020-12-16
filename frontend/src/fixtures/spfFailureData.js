export const rawSpfFailureData = {
  findDomainByDomain: {
    id: 'test-id=',
    __typename: 'Domain',
    dmarcSummaryByPeriod: {
      __typename: 'Period',
      domain: 'test-domain',
      month: 'LAST30DAYS',
      year: '2020',
      detailTables: {
        spfFailure: {
          edges: [
            {
              node: {
                dnsHost: 'test-dns-host',
                envelopeFrom: null,
                guidance: 'test-guidance',
                headerFrom: 'test-header',
                sourceIpAddress: '456.456.456.456',
                spfAligned: false,
                spfDomains: 'test-spf-domains',
                spfResults: 'pass',
                totalMessages: 400,
                __typename: 'SpfFailureTable',
              },
              __typename: 'SpfFailureTableEdge',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: 'end-cursor=',
            hasPreviousPage: false,
            startCursor: 'start-cursor==',
            __typename: 'PageInfo',
          },
          __typename: 'SpfFailureTableConnection',
        },
        __typename: 'DetailTables',
      },
    },
  },
}
