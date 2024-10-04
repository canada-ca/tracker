export const userOrgAffiliationsData = {
  data: {
    findMe: {
      affiliations: {
        edges: [
          {
            node: {
              organization: {
                id: 'testid=',
                acronym: 'test-org',
                slug: 'test-organization',
                __typename: 'Organization',
              },
              permission: 'ADMIN',
              __typename: 'UserAffiliations',
            },
            __typename: 'UserAffiliationsEdge',
          },
        ],
        __typename: 'UserAffiliationsConnection',
      },
      __typename: 'PersonalUser',
    },
  },
}

export const rawAdminPanelData = {
  data: {
    findOrganizationBySlug: {
      id: 'testid=',
      name: 'Test Organization',
      domains: {
        edges: [
          {
            node: {
              id: 'testid1',
              domain: 'testdomain1',
              lastRan: null,
              __typename: 'Domain',
            },
            __typename: 'DomainEdge',
          },
          {
            node: {
              id: 'testid2=',
              domain: 'testdomain2',
              lastRan: '2020-12-06 17:51:25.113689',
              __typename: 'Domain',
            },
            __typename: 'DomainEdge',
          },
          {
            node: {
              id: 'testid3=',
              domain: 'testdomain3',
              lastRan: '2020-12-06 17:51:25.113689',
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
      affiliations: {
        edges: [
          {
            node: {
              id: 'testid==',
              permission: 'SUPER_ADMIN',
              user: {
                userName: 'test.user@email.com',
                displayName: 'test User Name',
                __typename: 'SharedUser',
              },
              __typename: 'UserAffiliations',
            },
            __typename: 'UserAffiliationsEdge',
          },
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'starcursor==',
          endCursor: 'endcursor==',
          __typename: 'PageInfo',
        },
        totalCount: 2,
        __typename: 'UserAffiliationsConnection',
      },
      __typename: 'Organization',
    },
  },
}
