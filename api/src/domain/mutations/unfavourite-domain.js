import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { removeDomainUnion } from '../unions'

export const unfavouriteDomain = new mutationWithClientMutationId({
  name: 'UnfavouriteDomain',
  description: "Mutation to remove domain from user's personal myTracker view.",
  inputFields: () => ({
    domainId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The global id of the domain you wish to favourite.',
    },
  }),
  outputFields: () => ({
    result: {
      type: new GraphQLNonNull(removeDomainUnion),
      description: '`RemoveDomainUnion` returning either a `DomainResultType`, or `DomainErrorType` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
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
      console.warn(
        `User: ${userKey} attempted to unfavourite ${domainId} however no domain is associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to unfavourite unknown domain.`),
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

    if (typeof checkUserDomain === 'undefined') {
      console.warn(`User: ${userKey} attempted to unfavourite a domain, however domain is not favourited.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to unfavourite domain, domain is not favourited.`),
      }
    }

    await domainDataSource.unfavourite({ domain, user })

    console.info(`User: ${userKey} successfully removed domain ${domain.domain} from favourites.`)

    return {
      _type: 'result',
      status: i18n._(t`Successfully removed domain: ${domain.domain} from favourites.`),
      domain,
    }
  },
})
