const { GraphQLObjectType, GraphQLString } = require('graphql')
const { userPersonalType } = require('./base')

const authResultType = new GraphQLObjectType({
  name: 'AuthResult',
  description: `An object used to return information when users sign up or authenticate.`,
  fields: () => ({
    authToken: {
      type: GraphQLString,
      description: `JWT used for accessing controlled content.`,
      resolve: ({ token }) => token,
    },
    user: {
      type: userPersonalType,
      description: `User that has just been created or signed in.`,
      resolve: ({ user }) => user,
    },
  }),
})

module.exports = {
  authResultType,
}
