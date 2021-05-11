export const rawDmarcFailureData = {
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
          dmarcFailure: {
            edges: [
              {
                node: {
                  dkimDomains: ['domain1.ca', 'domain2.ca'],
                  dkimSelectors: ['selector1'],
                  disposition: 'none',
                  dnsHost: 'test.dns.ca',
                  envelopeFrom: null,
                  headerFrom: 'test.header.ca',
                  sourceIpAddress: '123.123.123.123',
                  spfDomains: ['test.spf.ca'],
                  totalMessages: 112,
                  __typename: 'DmarcFailureTable',
                },
                __typename: 'DmarcFailureTableEdge',
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: 'endcursor',
              hasPreviousPage: false,
              startCursor: 'startcursor=',
              __typename: 'PageInfo',
            },
            __typename: 'DmarcFailureTableConnection',
          },
          __typename: 'DetailTables',
        },
      },
    },
  },
}
