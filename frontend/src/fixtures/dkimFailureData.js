export const rawDkimFailureData = {
  findDomainByDomain: {
    id: 'test-id=',
    __typename: 'Domain',
    dmarcSummaryByPeriod: {
      __typename: 'Period',
      domain: 'test-domain',
      month: 'LAST30DAYS',
      year: '2020',
      detailTables: {
        dkimFailure: {
          edges: [
            {
              node: {
                dkimAligned: true,
                dkimDomains: '',
                dkimResults: '',
                dkimSelectors: '',
                dnsHost: 'test-dns-host',
                envelopeFrom: null,
                guidance: 'test-guidance',
                headerFrom: 'test-header',
                sourceIpAddress: '123.123.123.123',
                totalMessages: 500,
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: 'end-cursor=',
            hasPreviousPage: false,
            startCursor: 'start-cursor==',
            __typename: 'PageInfo',
          },
        },
      },
    },
  },
}
