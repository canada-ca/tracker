import { GraphQLBoolean, GraphQLObjectType, GraphQLString } from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'
import { GraphQLEmailAddress } from 'graphql-scalars'
import { affiliationOrgOrder } from '../../affiliation/inputs'
import { affiliationConnection } from '../../affiliation/objects'

import { nodeInterface } from '../../node'

export const userSharedType = new GraphQLObjectType({
  name: 'SharedUser',
  fields: () => ({
    id: globalIdField('user'),
    displayName: {
      type: GraphQLString,
      description: 'Users display name.',
      resolve: ({ displayName }) => displayName,
    },
    userName: {
      type: GraphQLEmailAddress,
      description: 'Users email address.',
      resolve: ({ userName }) => userName,
    },
    emailValidated: {
      type: GraphQLBoolean,
      description: 'Has the user email verified their account.',
      resolve: ({ emailValidated }) => emailValidated,
    },
    affiliations: {
      type: affiliationConnection.connectionType,
      description: 'Users affiliations to various organizations.',
      args: {
        orderBy: {
          type: affiliationOrgOrder,
          description: 'Ordering options for affiliation connections.',
        },
        search: {
          type: GraphQLString,
          description: 'String used to search for affiliated organizations.',
        },
        ...connectionArgs,
      },
      resolve: async (
        { _id },
        args,
        { loaders: { loadAffiliationConnectionsByUserId } },
      ) => {
        const affiliations = await loadAffiliationConnectionsByUserId({
          userId: _id,
          ...args,
        })
        return affiliations
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `This object is used for showing none personal user details,
and is used for limiting admins to the personal details of users.`,
})
