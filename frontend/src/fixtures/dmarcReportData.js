export const rawDmarcReportData = {
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
                  dkimDomains: 'test.dkim.ca',
                  dkimSelectors: 'selectortest',
                  dnsHost: 'test.dns',
                  headerFrom: 'test.header.ca',
                  spfDomains: 'test.spf.ca',
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
          dkimFailure: {
            edges: [
              {
                node: {
                  dkimAligned: false,
                  dkimDomains: '',
                  dkimResults: '',
                  dkimSelectors: '',
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
                  spfDomains: 'test.spf.ca',
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
          dmarcFailure: {
            edges: [
              {
                node: {
                  dkimDomains: '',
                  dkimSelectors: '',
                  disposition: 'none',
                  dnsHost: 'test.dns.ca',
                  envelopeFrom: null,
                  headerFrom: 'test.header.ca',
                  sourceIpAddress: '123.123.123.123',
                  spfDomains: 'test.spf.ca',
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
