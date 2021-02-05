export const rawDmarcReportSummaryTableData = {
  data: {
    findMyDomains: {
      edges: [
        {
          node: {
            id: 'testid1=',
            domain: 'domain1.ca',
            dmarcSummaryByPeriod: {
              month: 'LAST30DAYS',
              year: '2021',
              domain: { domain: 'domain1.ca' },
              categoryPercentages: {
                failPercentage: 31.5,
                fullPassPercentage: 1.88,
                passDkimOnlyPercentage: 4.51,
                passSpfOnlyPercentage: 4.12,
                totalMessages: 7803,
                __typename: 'CategoryPercentages',
              },
              __typename: 'DmarcSummary',
            },
            __typename: 'Domain',
          },

          __typename: 'DomainEdge',
        },
        {
          node: {
            id: 'testid2=',
            domain: 'domain2.ca',
            dmarcSummaryByPeriod: {
              month: 'LAST30DAYS',
              year: '2021',
              domain: { domain: 'domain2.ca' },
              categoryPercentages: {
                failPercentage: 31.5,
                fullPassPercentage: 1.88,
                passDkimOnlyPercentage: 4.51,
                passSpfOnlyPercentage: 4.12,
                totalMessages: 7803,
                __typename: 'CategoryPercentages',
              },
              __typename: 'DmarcSummary',
            },
            __typename: 'Domain',
          },

          __typename: 'DomainEdge',
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: 'endcursor=',
        hasPreviousPage: false,
        startCursor: 'startcursor=',
        __typename: 'PageInfo',
      },
      __typename: 'DomainConnection',
    },
  },
}
