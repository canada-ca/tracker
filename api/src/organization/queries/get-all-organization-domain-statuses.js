import {GraphQLString} from 'graphql'

import {t} from "@lingui/macro"

export const getAllOrganizationDomainStatuses = {
  type: GraphQLString,
  description: 'CSV formatted output of all domains in all organizations including their email and web scan statuses.',
  resolve: async (
    _,
    _args,
    {
      userKey,
      i18n,
      auth: {
        checkSuperAdmin,
        userRequired,
        verifiedRequired,
        loginRequiredBool,
      },
      loaders: {loadAllOrganizationDomainStatuses},
    },
  ) => {
    if (loginRequiredBool) {
      const user = await userRequired()
      verifiedRequired({user})

      const isSuperAdmin = await checkSuperAdmin()

      if (!isSuperAdmin) {
        console.warn(
          `User: ${userKey} attempted to load all organization statuses but login is required and they are not a super admin.`,
        )
        throw new Error(
          i18n._(
            t`Permissions error. You do not have sufficient permissions to access this data.`,
          ),
        )
      }

    }

    const domainStatuses = await loadAllOrganizationDomainStatuses()

    console.info(`User ${userKey} successfully retrieved all domain statuses.`)

    if(domainStatuses === undefined) return domainStatuses

    const headers = ["Organization name (English)", "Nom de l'organisation (Français)", "Domain", "ITPIN", "HTTPS", "HSTS", "Ciphers", "Curves", "Protocols", "SPF", "DKIM", "DMARC"]
    let csvOutput = headers.join(',')
    domainStatuses.forEach((domainStatus) => {
      const csvLine = headers.map((header) => domainStatus[header]).join(',')
      csvOutput += `\n${csvLine}`
    })

    return csvOutput
  },
}
