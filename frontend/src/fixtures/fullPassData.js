export const rawFullPassData = {
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
          fullPass: {
            edges: [
              {
                cursor: 'testid==',
                node: {
                  sourceIpAddress: '123.123.123.123',
                  envelopeFrom: null,
                  dkimDomains: ['test.dkim.ca'],
                  dkimSelectors: ['selectortest'],
                  dnsHost: 'test.dns',
                  headerFrom: 'test.header.ca',
                  spfDomains: ['test.spf.ca'],
                  totalMessages: 536,
                  __typename: 'FullPassTable',
                },
                __typename: 'FullPassTableEdge',
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: 'endcursor=',
              hasPreviousPage: false,
              startCursor: 'startcursor==',
              __typename: 'PageInfo',
            },
            __typename: 'FullPassTableConnection',
          },
          __typename: 'DetailTables',
        },
      },
    },
  },
}
