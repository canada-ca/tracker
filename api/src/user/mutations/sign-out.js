import {t} from '@lingui/macro'
import {GraphQLString} from 'graphql'
import {mutationWithClientMutationId} from 'graphql-relay'

export const signOut = new mutationWithClientMutationId({
  name: 'SignOut',
  description:
    'This mutation allows a user to sign out, and clear their cookies.',
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description: 'Status of the users signing-out.',
      resolve: ({status}) => status,
    },
  }),
  mutateAndGetPayload: async (_, {i18n, response}) => {
    response.cookie('refresh_token', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: true,
      sameSite: true,
    })

    return {
      status: i18n._(t`Successfully signed out.`),
    }
  },
})
