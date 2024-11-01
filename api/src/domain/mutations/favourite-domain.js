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
      query,
      collections,
      transaction,
      userKey,
      auth: { userRequired, verifiedRequired },
      loaders: { loadDomainByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Get User
    const user = await userRequired()
    verifiedRequired({ user })

    // Cleanse input
    const { type: _domainType, id: domainId } = fromGlobalId(cleanseInput(args.domainId))

    // Get domain from db
    const domain = await loadDomainByKey.load(domainId)
    // Check to see if domain exists
    if (typeof domain === 'undefined') {
      console.warn(`User: ${userKey} attempted to favourite ${domainId} however no domain is associated with that id.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to favourite unknown domain.`),
      }
    }

    // Check to see if domain already favourited by user
    let checkDomainCursor
    try {
      checkDomainCursor = await query`
        WITH domains
        FOR v, e IN 1..1 ANY ${domain._id} favourites
            FILTER e._from == ${user._id}
            RETURN e
      `
    } catch (err) {
      console.error(`Database error occurred while running check to see if domain already favourited: ${err}`)
      throw new Error(i18n._(t`Unable to favourite domain. Please try again.`))
    }

    let checkUserDomain
    try {
      checkUserDomain = await checkDomainCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred while running check to see if domain already favourited: ${err}`)
      throw new Error(i18n._(t`Unable to favourite domain. Please try again.`))
    }

    if (typeof checkUserDomain !== 'undefined') {
      console.warn(`User: ${userKey} attempted to favourite a domain, however user already has that domain favourited.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to favourite domain, user has already favourited it.`),
      }
    }

    // Setup Transaction
    const trx = await transaction(collections)

    try {
      await trx.step(
        () =>
          query`
            WITH favourites
            INSERT {
              _from: ${user._id},
              _to: ${domain._id},
            } INTO favourites
          `,
      )
    } catch (err) {
      console.error(`Transaction step error occurred for user: ${userKey} when inserting new domain edge: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to favourite domain. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction commit error occurred while user: ${userKey} was creating domain: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to favourite domain. Please try again.`))
    }

    console.info(`User: ${userKey} successfully favourited domain ${domain.domain}.`)

    return {
      ...domain,
    }
  },
})
