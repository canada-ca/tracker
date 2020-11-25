export const rawAdminPanelData = {
  data: {
    findOrganizationBySlug: {
      id: 'NDY4MTc2NjcxMA==',
      name: 'Buckridge Inc',
      domains: {
        edges: [
          {
            node: {
              id: 'NjkzMTM1NjAwNQ==',
              domain: 'tbs-sct.gc.ca',
              lastRan: '2020-11-25T13:45:31Z',
              __typename: 'Domain',
            },
            __typename: 'DomainEdge',
          },
          {
            node: {
              id: 'NDYwNjMxNzg2MQ==',
              domain: 'cse-cst.gc.ca',
              lastRan: '2020-11-25T06:50:01Z',
              __typename: 'Domain',
            },
            __typename: 'DomainEdge',
          },
        ],
        pageInfo: {
          endCursor: 'string',
          hasNextPage: true,
          __typename: 'PageInfo',
        },
        totalCount: 14,
        __typename: 'DomainConnection',
      },
      affiliations: {
        edges: [
          {
            node: {
              userId: 'NDUxNzAzMDY4NQ==',
              permission: 'USER',
              user: {
                userName: 'Winnifred_Legros19@yahoo.com',
                displayName: 'Fredy',
                tfaValidated: false,
                __typename: 'User',
              },
              __typename: 'UserAffiliations',
            },
            __typename: 'UserAffiliationsEdge',
          },
          {
            node: {
              userId: 'NzkzMDM3ODg5NQ==',
              permission: 'USER',
              user: {
                userName: 'Lonny46@hotmail.com',
                displayName: 'Addie',
                tfaValidated: true,
                __typename: 'User',
              },
              __typename: 'UserAffiliations',
            },
            __typename: 'UserAffiliationsEdge',
          },
        ],
        pageInfo: {
          endCursor: 'string',
          hasNextPage: true,
          __typename: 'PageInfo',
        },
        totalCount: 1,
        __typename: 'UserAffiliationsConnection',
      },
      __typename: 'Organization',
    },
  },
}
