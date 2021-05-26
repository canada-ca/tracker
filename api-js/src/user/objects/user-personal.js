import crypto from 'crypto'
import { GraphQLBoolean, GraphQLObjectType, GraphQLString } from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'
import { GraphQLEmailAddress, GraphQLPhoneNumber } from 'graphql-scalars'

import { affiliationOrgOrder } from '../../affiliation/inputs'
import { affiliationConnection } from '../../affiliation/objects'
import { LanguageEnums, TfaSendMethodEnum } from '../../enums'
import { nodeInterface } from '../../node'

const { CIPHER_KEY } = process.env

export const userPersonalType = new GraphQLObjectType({
  name: 'PersonalUser',
  fields: () => ({
    id: globalIdField('users'),
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
      resolve: ({ phoneDetails }) => {
        if (typeof phoneDetails === 'undefined' || phoneDetails === null) {
          return null
        }
        const { iv, tag, phoneNumber: encrypted } = phoneDetails
        const decipher = crypto.createDecipheriv(
          'aes-256-ccm',
          String(CIPHER_KEY),
          Buffer.from(iv, 'hex'),
          { authTagLength: 16 },
        )
        decipher.setAuthTag(Buffer.from(tag, 'hex'))
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
      },
    },
    preferredLang: {
      type: LanguageEnums,
      description: 'Users preferred language.',
      resolve: ({ preferredLang }) => preferredLang,
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
    affiliations: {
      type: affiliationConnection.connectionType,
      description: 'Users affiliations to various organizations.',
      args: {
        orderBy: {
          type: affiliationOrgOrder,
          description: 'Ordering options for affiliation connections.',
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
  description: `This object is used for showing personal user details, 
and is used for only showing the details of the querying user.`,
})
