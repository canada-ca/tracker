import {GraphQLObjectType} from 'graphql'
import {globalIdField} from 'graphql-relay'

import {RoleEnums} from '../../enums'
import {organizationType} from '../../organization/objects'
import {userSharedType} from '../../user/objects'
import {nodeInterface} from '../../node'

export const affiliationType = new GraphQLObjectType({
  name: 'Affiliation',
  fields: () => ({
    id: globalIdField('affiliation'),
    permission: {
      type: RoleEnums,
      description: "User's level of access to a given organization.",
      resolve: ({permission}) => permission,
    },
    user: {
      type: userSharedType,
      description: 'The affiliated users information.',
      resolve: async ({_to}, _args, {dataSources: {user: userDataSource}}) => {
        const userKey = _to.split('/')[1]
        const user = await userDataSource.byKey.load(userKey)
        user.id = user._key
        return user
      },
    },
    organization: {
      type: organizationType,
      description: 'The affiliated organizations information.',
      resolve: async ({_from}, _args, {dataSources: {organization}}) => {
        const orgKey = _from.split('/')[1]
        const org = await organization.byKey.load(orgKey)
        org.id = org._key
        return org
      },
    },
  }),
  interfaces: [nodeInterface],
  description:
    'User Affiliations containing the permission level for the given organization, the users information, and the organizations information.',
})
