export const rawDmarcReportSummaryTableData = {
  data: {
    findMyDmarcSummaries: {
      edges: [
        {
          node: {
            id: 'testid1=',
            domain: {
              domain: 'domain1.ca',
              __typename: 'Domain',
            },
            month: 'LAST30DAYS',
            year: '2021',
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
          __typename: 'DmarcSummaryEdge',
        },
        {
          node: {
            id: 'testid2=',
            domain: {
              domain: 'domain2.ca',
              __typename: 'Domain',
            },
            month: 'LAST30DAYS',
            year: '2021',
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
          __typename: 'DmarcSummaryEdge',
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: 'endcursor=',
        hasPreviousPage: false,
        startCursor: 'startcursor=',
        __typename: 'PageInfo',
      },
      __typename: 'DmarcSummaryConnection',
    },
  },
}
