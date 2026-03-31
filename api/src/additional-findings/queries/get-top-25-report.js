import { GraphQLString } from 'graphql'

export const getTop25Reports = {
  type: GraphQLString,
  description: 'CSV formatted output of top 25 reports.',
  resolve: async (
    _,
    args,
    {
      userKey,
      auth: { checkSuperAdmin, userRequired, verifiedRequired, superAdminRequired },
      dataSources: { additionalFindings },
      language,
    },
  ) => {
    const user = await userRequired()
    verifiedRequired({ user })

    const isSuperAdmin = await checkSuperAdmin()
    superAdminRequired({ user, isSuperAdmin })

    const top25Reports = await additionalFindings.getTop25Reports({ ...args })

    console.info(`User ${userKey} successfully retrieved all top 25 reports.`)

    if (top25Reports === undefined) return top25Reports

    const headers = ['orgName', 'orgAcronym', 'assetCount']
    let csvOutput = headers.join(',')
    let totalAssetCount = 0
    top25Reports.forEach((domainStatus) => {
      const csvLine = headers
        .map((header) => {
          return `"${domainStatus[header]}"`
        })
        .join(',')
      csvOutput += `\n${csvLine}`
      totalAssetCount += domainStatus.assetCount
    })
    const govName = language === 'en' ? 'Government of Canada' : 'Gouvernement du Canada'
    csvOutput += `\n${govName},GC,${totalAssetCount}`

    return csvOutput
  },
}
