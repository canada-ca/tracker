import { GraphQLString } from 'graphql'

export const getAllVerifiedRuaDomains = {
  type: GraphQLString,
  description: 'JSON formatted output of all domains in verified organizations that send DMARC reports.',
  resolve: async (
    _,
    args,
    {
      userKey,
      auth: { checkSuperAdmin, userRequired, verifiedRequired, superAdminRequired },
      loaders: { loadAllVerifiedRuaDomains },
    },
  ) => {
    const user = await userRequired()
    verifiedRequired({ user })

    const isSuperAdmin = await checkSuperAdmin()
    superAdminRequired({ user, isSuperAdmin })

    const ruaDomains = await loadAllVerifiedRuaDomains({ ...args })

    console.info(`User ${userKey} successfully retrieved all domains with DMARC reports.`)

    const returnObj = {}
    ruaDomains.forEach(({ key, domains }) => {
      returnObj[key] = domains
    })

    return JSON.stringify(returnObj, null, 4)
  },
}
