export const rawOrgUserListData = {
  findOrganizationBySlug: {
    id: 'testid=',
    affiliations: {
      edges: [
        {
          node: {
            id: 'testid==',
            permission: 'SUPER_ADMIN',
            user: {
              userName: 'test.user@email.com',
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
      totalCount: 1,
      __typename: 'UserAffiliationsConnection',
    },
    __typename: 'Organization',
  },
}
