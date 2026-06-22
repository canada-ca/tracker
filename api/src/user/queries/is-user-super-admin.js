import { GraphQLBoolean } from 'graphql'

export const isUserSuperAdmin = {
  type: GraphQLBoolean,
  description: 'Query used to check if the user has a super admin role.',
  resolve: async (_, __, { auth: { userRequired }, dataSources: { user: userDataSource } }) => {
    const user = await userRequired()
    return userDataSource.isSuperAdmin({ userId: user._id })
  },
}
