export const rawDkimFailureData = {
  data: {
    findDomainByDomain: {
      id: 'testid=',
      dmarcSummaryByPeriod: {
        domain: { domain: 'test.domain.ca' },
        month: 'LAST30DAYS',
        year: '2020',
        detailTables: {
          dkimFailure: {
            edges: [
              {
                node: {
                  dkimAligned: false,
                  dkimDomains: ['domain1.ca', 'domain2.ca'],
                  dkimResults: '',
                  dkimSelectors: ['selector1', 'selector2'],
                  dnsHost: 'testhost',
                  envelopeFrom: null,
                  guidance: 'testguidance',
                  headerFrom: 'test.domain.ca',
                  sourceIpAddress: '123.123.123.123',
                  totalMessages: 112,
                  __typename: 'DkimFailureTable',
                },
                __typename: 'DkimFailureTableEdge',
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: 'endcursor=',
              hasPreviousPage: false,
              startCursor: 'startcursor=',
              __typename: 'PageInfo',
            },
            __typename: 'DkimFailureTableConnection',
          },
          __typename: 'DetailTables',
        },
        __typename: 'Period',
      },
      __typename: 'Domain',
    },
  },
}
