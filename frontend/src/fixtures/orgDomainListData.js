export const rawOrgDomainListData = {
  findOrganizationBySlug: {
    id: 'testid=',
    name: 'Test Organization',
    domains: {
      edges: [
        {
          node: {
            id: 'testid1',
            domain: 'canada.ca',
            lastRan: null,
            selectors: [],
            __typename: 'Domain',
          },
          __typename: 'DomainEdge',
        },
        {
          node: {
            id: 'testid2=',
            domain: 'testdomain2',
            lastRan: '2020-12-06 17:51:25.113689',
            selectors: [],
            __typename: 'Domain',
          },
          __typename: 'DomainEdge',
        },
        {
          node: {
            id: 'testid3=',
            domain: 'testdomain3',
            lastRan: '2020-12-06 17:51:25.113689',
            selectors: [],
            __typename: 'Domain',
          },
          __typename: 'DomainEdge',
        },
      ],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: true,
        startCursor: 'ZG9tYWluczoxMTg2MTU0',
        endCursor: 'ZG9tYWluczo2NDM4NDk=',
        __typename: 'PageInfo',
      },
      totalCount: 5,
      __typename: 'DomainConnection',
    },
    __typename: 'Organization',
  },
}

export const rawOrgDomainListDataEmpty = {
  findOrganizationBySlug: {
    id: 'testid=',
    name: 'Test Organization',
    domains: {
      edges: [],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: true,
        startCursor: 'ZG9tYWluczoxMTg2MTU0',
        endCursor: 'ZG9tYWluczo2NDM4NDk=',
        __typename: 'PageInfo',
      },
      totalCount: 5,
      __typename: 'DomainConnection',
    },
    __typename: 'Organization',
  },
}
