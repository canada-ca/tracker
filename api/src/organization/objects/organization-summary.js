import { GraphQLObjectType } from 'graphql'

import { categorizedSummaryType } from '../../summaries'
import { GraphQLDate } from 'graphql-scalars'
import { t } from '@lingui/macro'
import { guidanceTagOrder, guidanceTagConnection } from '../../guidance-tag'

const calculatePercentage = (numerator, denominator) => {
  if (denominator <= 0) {
    return 0
  } else {
    return Number(((numerator / denominator) * 100).toFixed(1))
  }
}

const createCategory = (name, count, total) => {
  return {
    name,
    count,
    percentage: calculatePercentage(count, total),
  }
}

export const organizationSummaryType = new GraphQLObjectType({
  name: 'OrganizationSummary',
  description: 'Summaries based on domains that the organization has claimed.',
  fields: () => ({
    date: {
      type: GraphQLDate,
      description: 'Date that the summary was computed.',
      resolve: ({ date }) => date,
    },
    dmarc: {
      type: categorizedSummaryType,
      description: 'Summary based on DMARC scan results for a given organization.',
      resolve: ({ dmarc }, _) => {
        const categories = [
          createCategory('pass', dmarc.pass, dmarc.total),
          createCategory('fail', dmarc.fail, dmarc.total),
        ]

        return {
          categories,
          total: dmarc.total,
        }
      },
    },
    https: {
      type: categorizedSummaryType,
      description: 'Summary based on HTTPS scan results for a given organization.',
      resolve: ({ https }, _) => {
        const categories = [
          createCategory('pass', https.pass, https.total),
          createCategory('fail', https.fail, https.total),
        ]

        return {
          categories,
          total: https.total,
        }
      },
    },
    mail: {
      type: categorizedSummaryType,
      description: 'Summary based on mail scan results for a given organization.',
      resolve: ({ mail }, _) => {
        const categories = [
          createCategory('pass', mail.pass, mail.total),
          createCategory('fail', mail.fail, mail.total),
        ]

        return {
          categories,
          total: mail.total,
        }
      },
    },
    web: {
      type: categorizedSummaryType,
      description: 'Summary based on web scan results for a given organization.',
      resolve: ({ web }, _) => {
        const categories = [createCategory('pass', web.pass, web.total), createCategory('fail', web.fail, web.total)]

        return {
          categories,
          total: web.total,
        }
      },
    },
    dmarcPhase: {
      type: categorizedSummaryType,
      description: 'Summary based on DMARC phases for a given organization.',
      resolve: ({ dmarc_phase }, _) => {
        const categories = [
          createCategory('not implemented', dmarc_phase.not_implemented, dmarc_phase.total),
          createCategory('assess', dmarc_phase.assess, dmarc_phase.total),
          createCategory('deploy', dmarc_phase.deploy, dmarc_phase.total),
          createCategory('enforce', dmarc_phase.enforce, dmarc_phase.total),
          createCategory('maintain', dmarc_phase.maintain, dmarc_phase.total),
        ]

        return {
          categories,
          total: dmarc_phase.total,
        }
      },
    },
    ssl: {
      type: categorizedSummaryType,
      description: 'Summary based on SSL scan results for a given organization.',
      resolve: ({ ssl }, _) => {
        const categories = [createCategory('pass', ssl.pass, ssl.total), createCategory('fail', ssl.fail, ssl.total)]

        return {
          categories,
          total: ssl.total,
        }
      },
    },
    webConnections: {
      type: categorizedSummaryType,
      description: 'Summary based on HTTPS and HSTS scan results for a given organization.',
      resolve: ({ web_connections }, _) => {
        const categories = [
          createCategory('pass', web_connections.pass, web_connections.total),
          createCategory('fail', web_connections.fail, web_connections.total),
        ]

        return {
          categories,
          total: web_connections.total,
        }
      },
    },
    spf: {
      type: categorizedSummaryType,
      description: 'Summary based on SPF scan results for a given organization.',
      resolve: ({ spf }, _) => {
        const categories = [createCategory('pass', spf.pass, spf.total), createCategory('fail', spf.fail, spf.total)]

        return {
          categories,
          total: spf.total,
        }
      },
    },
    dkim: {
      type: categorizedSummaryType,
      description: 'Summary based on DKIM scan results for a given organization.',
      resolve: ({ dkim }, _) => {
        const categories = [
          createCategory('pass', dkim.pass, dkim.total),
          createCategory('fail', dkim.fail, dkim.total),
        ]

        return {
          categories,
          total: dkim.total,
        }
      },
    },
    negativeFindings: {
      type: guidanceTagConnection,
      description: 'Aggregated negative findings for a given organization.',
      args: {
        orderBy: {
          type: guidanceTagOrder,
          description: 'Ordering options for guidance tag connections.',
        },
      },
      resolve: async (
        { _id, negative_tags },
        args,
        {
          userKey,
          auth: { checkPermission, userRequired, verifiedRequired },
          loaders: { loadGuidanceTagSummaryConnectionsByTagId },
        },
      ) => {
        const user = await userRequired()
        verifiedRequired({ user })

        const permission = await checkPermission({ orgId: _id })
        if (!['user', 'admin', 'owner', 'super_admin'].includes(permission)) {
          console.error(
            `User "${userKey}" attempted to retrieve CSV output for organization "${_id}". Permission: ${permission}`,
          )
          throw new Error(t`Permission Denied: Please contact organization user for help with retrieving this domain.`)
        }

        const guidanceTags = await loadGuidanceTagSummaryConnectionsByTagId({
          guidanceTags: negative_tags,
          ...args,
        })
        return guidanceTags
      },
    },
  }),
})
