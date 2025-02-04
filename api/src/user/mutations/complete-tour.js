import { GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { completeTourUnion } from '../unions'

export const completeTour = new mutationWithClientMutationId({
  name: 'CompleteTour',
  description:
    'This mutation allows users to confirm that they have completed the tour. This mutation will update the user object in the database to reflect that the user has completed the tour.',
  inputFields: () => ({
    tourId: {
      type: GraphQLString,
      description: 'The id of the tour that the user is confirming completion of.',
    },
  }),
  outputFields: () => ({
    result: {
      type: completeTourUnion,
      description: '`CompleteTourUnion` returning either a `CompleteTourResult`, or `CompleteTourError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    { i18n, query, auth: { userRequired }, loaders: { loadUserByKey }, validators: { cleanseInput } },
  ) => {
    // Cleanse Input
    const tourId = cleanseInput(args.tourId)

    // Get user info from DB
    const user = await userRequired()

    if (!tourId) {
      console.warn(`User: ${user._key} did not provide a tour id when attempting to confirm completion of the tour.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to confirm completion of the tour. Please try again.`),
      }
    }

    // Complete tour
    try {
      const completeTourCursor = await query`
        LET userCompleteTours = FIRST(
          FOR user IN users
            FILTER user._key == ${user._key}
            LIMIT 1
            RETURN user.completedTours
        )
        UPDATE { _key: ${user._key} }
        WITH {
          completedTours: APPEND(
            userCompleteTours[* FILTER CURRENT.tourId != ${tourId}],
            { tourId: ${tourId}, completedAt: DATE_ISO8601(DATE_NOW()) }
          )
        }
        IN users
      `
      await completeTourCursor.next()
    } catch (err) {
      console.error(`Database error occurred when user: ${user._key} attempted to complete tour: ${tourId}: ${err}`)
      throw new Error(i18n._(t`Unable to confirm completion of the tour. Please try again.`))
    }

    await loadUserByKey.clear(user._key)
    const returnUser = await loadUserByKey.load(user._key)

    console.info(`User: ${user._key} has confirmed completion of tour: ${tourId}`)
    return {
      _type: 'success',
      status: i18n._(t`Tour completion confirmed successfully`),
      user: returnUser,
    }
  },
})
