import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { createDomainUnion } from '../unions'

export const favouriteDomain = new mutationWithClientMutationId({
  name: 'FavouriteDomain',
  description: "Mutation to add domain to user's personal myTracker view.",
  inputFields: () => ({
    domainId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the domain you wish to favourite.',
    },
  }),
  outputFields: () => ({
    result: {
      type: createDomainUnion,
      description: '`CreateDomainUnion` returning either a `Domain`, or `CreateDomainError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      userKey,
      auth: { userRequired, verifiedRequired },
      dataSources: { domain: domainDataSource },
      validators: { cleanseInput },
    },
  ) => {
    // Get User
    const user = await userRequired()
    verifiedRequired({ user })

    // Cleanse input
    const { type: _domainType, id: domainId } = fromGlobalId(cleanseInput(args.domainId))

    // Get domain from db
    const domain = await domainDataSource.byKey.load(domainId)
    // Check to see if domain exists
    if (typeof domain === 'undefined') {
      console.warn(`User: ${userKey} attempted to favourite ${domainId} however no domain is associated with that id.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to favourite unknown domain.`),
      }
    }

    const alreadyFavourited = await domainDataSource.isFavouritedByUser({
      domainId: domain._id,
      userId: user._id,
    })

    if (alreadyFavourited) {
      console.warn(`User: ${userKey} attempted to favourite a domain, however user already has that domain favourited.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to favourite domain, user has already favourited it.`),
      }
    }

    await domainDataSource.favourite({ domain, user })

    console.info(`User: ${userKey} successfully favourited domain ${domain.domain}.`)

    return {
      ...domain,
    }
  },
})
