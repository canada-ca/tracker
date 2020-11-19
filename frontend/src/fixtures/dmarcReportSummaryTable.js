export const rawDmarcReportSummaryTableData = {
  data: {
    findMyDomains: {
      edges: [
        {
          node: {
            domain: 'forces.gc.ca',
            dmarcSummaryByPeriod: {
              categoryPercentages: {
                failPercentage: 57.89,
                fullPassPercentage: 54.38,
                passDkimOnlyPercentage: 93.48,
                passSpfOnlyPercentage: 25.64,
                totalMessages: 23452,
                __typename: 'CategoryPercentages',
              },
              __typename: 'Period',
            },
            __typename: 'Domain',
          },
          __typename: 'DomainEdge',
        },
        {
          node: {
            domain: 'rcmp-grc.gc.ca',
            dmarcSummaryByPeriod: {
              categoryPercentages: {
                failPercentage: 93.48,
                fullPassPercentage: 57.89,
                passDkimOnlyPercentage: 54.38,
                passSpfOnlyPercentage: 57.89,
                totalMessages: 86954,
                __typename: 'CategoryPercentages',
              },
              __typename: 'Period',
            },
            __typename: 'Domain',
          },
          __typename: 'DomainEdge',
        },
        {
          node: {
            domain: 'tbs-sct.gc.ca',
            dmarcSummaryByPeriod: {
              categoryPercentages: {
                failPercentage: 57.89,
                fullPassPercentage: 25.64,
                passDkimOnlyPercentage: 57.89,
                passSpfOnlyPercentage: 25.64,
                totalMessages: 54386,
                __typename: 'CategoryPercentages',
              },
              __typename: 'Period',
            },
            __typename: 'Domain',
          },
          __typename: 'DomainEdge',
        },
      ],
      __typename: 'DomainConnection',
    },
  },
}
