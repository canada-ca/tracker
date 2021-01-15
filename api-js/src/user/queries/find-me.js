import { userPersonalType } from '../objects'

export const findMe = {
  type: userPersonalType,
  description: 'Query the currently logged in user.',
  resolve: async (_, __, { auth: { userRequired } }) => {
    // Get querying user
    const user = await userRequired()

    user.id = user._key

    return user
  },
}
