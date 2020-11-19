export const rawAdminPanelData = {
  data: {
    findOrganizationBySlug: {
      id: 'NTc5MjU2MjY4',
      domains: {
        edges: [
          {
            node: {
              id: 'NjgxNjk3MTc5Nw==',
              domain: 'rcmp-grc.gc.ca',
              lastRan: '2020-11-19T18:11:20Z',
              __typename: 'Domain',
            },
            __typename: 'DomainEdge',
          },
          {
            node: {
              id: 'MTI0MjEyNjQ1Ng==',
              domain: "jAva&Tab;script:alert('XSS')",
              lastRan: '2020-11-19T11:22:51Z',
              __typename: 'Domain',
            },
            __typename: 'DomainEdge',
          },
        ],
        pageInfo: {
          endCursor: 'string',
          hasNextPage: false,
          __typename: 'PageInfo',
        },
        __typename: 'DomainConnection',
      },
      __typename: 'Organization',
    },
  },
}
