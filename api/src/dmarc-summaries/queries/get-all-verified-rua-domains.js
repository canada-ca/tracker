import { GraphQLString, GraphQLList } from 'graphql'
import { domainFilter } from '../../domain/inputs'

export const getAllOrganizationDomainStatuses = {
  type: GraphQLString,
  description: 'JSON formatted output of all domains in verified organizations that send DMARC reports.',
  args: {
    filters: {
      type: new GraphQLList(domainFilter),
      description: 'Filters used to limit domains returned.',
    },
  },
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

    return JSON.stringify(ruaDomains)
  },
}
