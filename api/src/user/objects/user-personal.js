import { GraphQLBoolean, GraphQLObjectType, GraphQLString } from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'
import { GraphQLEmailAddress, GraphQLPhoneNumber } from 'graphql-scalars'

import { affiliationOrgOrder } from '../../affiliation/inputs'
import { affiliationConnection } from '../../affiliation/objects'
import { TfaSendMethodEnum } from '../../enums'
import { nodeInterface } from '../../node'
import { emailSubscriptionOptionsType } from './email-subscription-options'

export const userPersonalType = new GraphQLObjectType({
  name: 'PersonalUser',
  fields: () => ({
    id: globalIdField('user'),
    userName: {
      type: GraphQLEmailAddress,
      description: 'Users email address.',
      resolve: ({ userName }) => userName,
    },
    displayName: {
      type: GraphQLString,
      description: 'Name displayed to other users.',
      resolve: ({ displayName }) => displayName,
    },
    phoneNumber: {
      type: GraphQLPhoneNumber,
      description: 'The phone number the user has setup with tfa.',
      resolve: ({ phoneDetails }, _args, { validators: { decryptPhoneNumber } }) => {
        if (typeof phoneDetails === 'undefined' || phoneDetails === null) {
          return null
        }
        return decryptPhoneNumber(phoneDetails)
      },
    },
    phoneValidated: {
      type: GraphQLBoolean,
      description: 'Has the user completed phone validation.',
      resolve: ({ phoneValidated }) => phoneValidated,
    },
    emailValidated: {
      type: GraphQLBoolean,
      description: 'Has the user email verified their account.',
      resolve: ({ emailValidated }) => emailValidated,
    },
    tfaSendMethod: {
      type: TfaSendMethodEnum,
      description: 'The method in which TFA codes are sent.',
      resolve: ({ tfaSendMethod }) => tfaSendMethod,
    },
    insideUser: {
      type: GraphQLBoolean,
      description: 'Does the user want to see new features in progress.',
      resolve: ({ insideUser }) => insideUser,
    },
    receiveUpdateEmails: {
      type: GraphQLBoolean,
      description: 'Does the user want to receive update emails.',
      resolve: ({ receiveUpdateEmails }) => receiveUpdateEmails,
    },
    emailUpdateOptions: {
      type: emailSubscriptionOptionsType,
      description:
        'A number of different emails ther user can optionally receieve periodically that provide updates about their organization.',
      resolve: ({ emailUpdateOptions }) => emailUpdateOptions,
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
      resolve: async ({ _id }, args, { loaders: { loadAffiliationConnectionsByUserId } }) => {
        const affiliations = await loadAffiliationConnectionsByUserId({
          userId: _id,
          ...args,
        })
        return affiliations
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `This object is used for showing personal user details,
and is used for only showing the details of the querying user.`,
})
