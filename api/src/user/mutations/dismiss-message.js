import { GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { dismissMessageUnion } from '../unions/dismiss-message-union'

export const dismissMessage = new mutationWithClientMutationId({
  name: 'DismissMessage',
  description:
    'This mutation allows users to dismiss a message that is displayed to them when they log in. This mutation will update the user object in the database to reflect that the message has been dismissed.',
  inputFields: () => ({
    messageId: {
      type: GraphQLString,
      description: 'The id of the message that the user is dismissing.',
    },
  }),
  outputFields: () => ({
    result: {
      type: dismissMessageUnion,
      description: '`DismissMessageUnion` returning either a `DismissMessageResult`, or `DismissMessageError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    { i18n, query, auth: { userRequired }, loaders: { loadUserByKey }, validators: { cleanseInput } },
  ) => {
    // Cleanse Input
    const messageId = cleanseInput(args.messageId)

    if (!messageId) {
      console.warn(`User attempted to dismiss message without providing a message id.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to dismiss message. Please try again.`),
      }
    }

    // Get user info from DB
    const user = await userRequired()

    // Dismiss message
    try {
      const dismissMessageCursor = await query`
        LET userDismissedMessages = FIRST(
          FOR user IN users
            FILTER user._key == ${user._key}
            LIMIT 1
            RETURN user.dismissedMessages
        )
        UPDATE { _key: ${user._key} }
        WITH {
          dismissedMessages: APPEND(
            userDismissedMessages[* FILTER CURRENT.messageId != ${messageId}],
            { messageId: ${messageId}, dismissedAt: DATE_NOW() }
          )
        }
        IN users
      `
      await dismissMessageCursor.next()
    } catch (err) {
      console.error(
        `Database error occurred when user: ${user._key} attempted to dismiss message: ${messageId}: ${err}`,
      )
      throw new Error(i18n._(t`Unable to dismiss message. Please try again.`))
    }

    await loadUserByKey.clear(user._key)
    const returnUser = await loadUserByKey.load(user._key)

    console.info(`User: ${user._key} successfully dismissed message: ${messageId}`)
    return {
      _type: 'success',
      status: i18n._(t`Message dismissed successfully`),
      user: returnUser,
    }
  },
})
