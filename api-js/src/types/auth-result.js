const { GraphQLObjectType, GraphQLString } = require('graphql')
const { userType } = require('./base')

const authResultType = new GraphQLObjectType({
    name: 'AuthResult',
    fields: () => ({
        authToken: {
            type: GraphQLString,
            description: 'JWT used for accessing controlled content.',
            resolve: async () => {},
        },
        user: {
            type: userType,
            description: 'User that has just been created or signed in.',
            resolve: async () => {},
        },
    }),
})

module.exports = {
    authResultType
}