import { GraphQLObjectType } from 'graphql'
import { StatusEnum } from '../../enums'

export const domainStatus = new GraphQLObjectType({
  name: 'DomainStatus',
  description:
    'This object contains how the domain is doing on the various scans we preform, based on the latest scan data.',
  fields: () => ({
    dkim: {
      type: StatusEnum,
      description: 'DKIM Status',
      resolve: ({ dkim }) => dkim,
    },
    dmarc: {
      type: StatusEnum,
      description: 'DMARC Status',
      resolve: ({ dmarc }) => dmarc,
    },
    https: {
      type: StatusEnum,
      description: 'HTTPS Status',
      resolve: ({ https }) => https,
    },
    spf: {
      type: StatusEnum,
      description: 'SPF Status',
      resolve: ({ spf }) => spf,
    },
    ssl: {
      type: StatusEnum,
      description: 'SSL Status',
      resolve: ({ ssl }) => ssl,
    },
  }),
})
