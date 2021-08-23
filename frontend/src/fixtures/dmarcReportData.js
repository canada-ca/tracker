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
                  dkimDomains: 'full-pass-dkim-domains-L30D.domain',
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
                  dkimDomains: 'dkim-failure-dkim-domains-L30D.domain',
                  dkimResults: '',
                  dkimSelectors: '',
                  dnsHost: 'testhost',
                  envelopeFrom: null,
                  guidance: 'testguidance',
                  headerFrom: 'test.domain.ca',
                  sourceIpAddress: '123.123.123.123',
                  totalMessages: 112,
                  guidanceTag: {
                    __typename: 'GuidanceTag',
                    guidance: '',
                    refLinks: [
                      {
                        __typename: 'RefLinks',
                        refLink: '',
                      },
                    ],
                  },
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
                  spfDomains: 'spf-failure-spf-domains-L30D.domain',
                  spfResults: 'pass',
                  totalMessages: 112,
                  guidanceTag: {
                    __typename: 'GuidanceTag',
                    guidance: '',
                    refLinks: [
                      {
                        __typename: 'RefLinks',
                        refLink: '',
                      },
                    ],
                  },
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
                  dkimDomains: 'dmarc-failure-dkim-domains-L30D.domain',
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

export const augustDmarcReportData = {
  data: {
    findDomainByDomain: {
      id: 'testid=',
      __typename: 'Domain',
      dmarcSummaryByPeriod: {
        __typename: 'Period',
        domain: { domain: 'august.domain' },
        month: 'AUGUST',
        year: '2020',
        detailTables: {
          fullPass: {
            edges: [
              {
                cursor: 'testid==',
                node: {
                  sourceIpAddress: '123.123.123.123',
                  envelopeFrom: null,
                  dkimDomains: 'full-pass-dkim-domains-august.domain',
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
                  dkimDomains: 'dkim-failure-dkim-domains-august.domain',
                  dkimResults: '',
                  dkimSelectors: '',
                  dnsHost: 'testhost',
                  envelopeFrom: null,
                  guidance: 'testguidance',
                  headerFrom: 'test.domain.ca',
                  sourceIpAddress: '123.123.123.123',
                  totalMessages: 112,
                  guidanceTag: {
                    __typename: 'GuidanceTag',
                    guidance: '',
                    refLinks: [
                      {
                        __typename: 'RefLinks',
                        refLink: '',
                      },
                    ],
                  },
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
                  spfDomains: 'spf-failure-spf-domains-august.domain',
                  spfResults: 'pass',
                  totalMessages: 112,
                  guidanceTag: {
                    __typename: 'GuidanceTag',
                    guidance: '',
                    refLinks: [
                      {
                        __typename: 'RefLinks',
                        refLink: '',
                      },
                    ],
                  },
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
                  dkimDomains: 'dmarc-failure-dkim-domains-august.domain',
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
