export const rawSpfFailureData = {
  data: {
    findDomainByDomain: {
      id: 'testid=',
      __typename: 'Domain',
      dmarcSummaryByPeriod: {
        __typename: 'Period',
        domain: { domain: 'test.domain.ca' },
        month: 'LAST30DAYS',
        year: '2020',
        detailTables: {
          spfFailure: {
            edges: [
              {
                node: {
                  dnsHost: 'test.dns',
                  envelopeFrom: null,
                  guidance: 'test.guidance',
                  headerFrom: 'test.header',
                  sourceIpAddress: '123.123.123.123',
                  spfAligned: false,
                  spfDomains: ['test.spf.ca'],
                  spfResults: 'pass',
                  totalMessages: 112,
                  __typename: 'SpfFailureTable',
                },
                __typename: 'SpfFailureTableEdge',
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: 'endcursor==',
              hasPreviousPage: false,
              startCursor: 'startcursor',
              __typename: 'PageInfo',
            },
            __typename: 'SpfFailureTableConnection',
          },
          __typename: 'DetailTables',
        },
      },
    },
  },
}
