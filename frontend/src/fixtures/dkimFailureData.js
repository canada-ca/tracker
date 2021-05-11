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
          __typename: 'DetailTables',
        },
        __typename: 'Period',
      },
      __typename: 'Domain',
    },
  },
}
// data: {
//   findDomainByDomain: {
//     id: 'testid=',
//     dmarcSummaryByPeriod: {
//       domain: 'test-domain',
//       month: 'LAST30DAYS',
//       year: '2020',
//       detailTables: {
//         dkimFailure: {
//           edges: [
//             {
//               node: {
//                 dkimAligned: true,
//                 dkimDomains: '',
//                 dkimResults: '',
//                 dkimSelectors: '',
//                 dnsHost: 'test-dns-host',
//                 envelopeFrom: null,
//                 guidance: 'test-guidance',
//                 headerFrom: 'test-header',
//                 sourceIpAddress: '123.123.123.123',
//                 totalMessages: 500,
//                 __typename: 'DkimFailureTable',
//               },
//               __typename: 'DkimFailureTableEdge',
//             },
//           ],
//           pageInfo: {
//             hasNextPage: false,
//             endCursor: 'endcursor=',
//             hasPreviousPage: false,
//             startCursor: 'startcursor==',
//             __typename: 'PageInfo',
//           },
//           __typename: 'DkimFailureTableConnection',
//         },
//         __typename: 'DetailTables',
//       },
//       __typename: 'Period',
//     },
//     __typename: 'Domain',
//   },
// },
// }
