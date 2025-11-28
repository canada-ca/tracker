import { GraphQLString, GraphQLList } from 'graphql'
import { domainFilter } from '../../domain/inputs'
import { i18n } from '@lingui/core'
import { t } from '@lingui/macro'

export const getAllOrganizationDomainStatuses = {
  type: GraphQLString,
  description: 'CSV formatted output of all domains in all organizations including their email and web scan statuses.',
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
      loaders: { loadAllOrganizationDomainStatuses },
    },
  ) => {
    const user = await userRequired()
    verifiedRequired({ user })

    const isSuperAdmin = await checkSuperAdmin()
    superAdminRequired({ user, isSuperAdmin })

    const domainStatuses = await loadAllOrganizationDomainStatuses({ ...args })

    console.info(`User ${userKey} successfully retrieved all domain statuses.`)

    if (domainStatuses === undefined) return domainStatuses

    const headers = [
      'domain',
      'orgNames',
      'orgAcronyms',
      'orgExternalIDs',
      'ipAddresses',
      'https',
      'hsts',
      'certificates',
      'ciphers',
      'curves',
      'protocols',
      'spf',
      'dkim',
      'dmarc',
      'phase',
      'rcode',
      'blocked',
      'wildcardSibling',
      'wildcardEntry',
      'hasEntrustCertificate',
      'top25Vulnerabilities',
    ]
    let csvOutput = headers.join(',')
    domainStatuses.forEach((domainStatus) => {
      const csvLine = headers
        .map((header) => {
          if (['orgNames', 'orgAcronyms', 'orgExternalIDs', 'ipAddresses', 'top25Vulnerabilities'].includes(header)) {
            return `"${domainStatus[header]?.join('|') || []}"`
          }
          if (header === 'phase') {
            switch (domainStatus[header]) {
              case 'assess':
                return i18n._(t`Assess`)
              case 'deploy':
                return i18n._(t`Deploy`)
              case 'enforce':
                return i18n._(t`Enforce`)
              case 'maintain':
                return i18n._(t`Maintain`)
              default:
                return ''
            }
          }
          return `"${domainStatus[header]}"`
        })
        .join(',')
      csvOutput += `\n${csvLine}`
    })

    return csvOutput
  },
}
