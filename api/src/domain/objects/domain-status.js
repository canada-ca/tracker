import { GraphQLObjectType } from 'graphql'
import { StatusEnum } from '../../enums'

export const domainStatus = new GraphQLObjectType({
  name: 'DomainStatus',
  description:
    'This object contains how the domain is doing on the various scans we preform, based on the latest scan data.',
  fields: () => ({
    ciphers: {
      type: StatusEnum,
      description: 'Ciphers Status',
      resolve: ({ ciphers }) => ciphers,
    },
    curves: {
      type: StatusEnum,
      description: 'Curves Status',
      resolve: ({ curves }) => curves,
    },
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
    hsts: {
      type: StatusEnum,
      description: 'HSTS Status',
      resolve: ({ hsts }) => hsts,
    },
    policy: {
      type: StatusEnum,
      description: 'Policy Status',
      resolve: ({ ciphers, https, hsts, protocols, ssl }) =>
        [ciphers, https, hsts, protocols, ssl].every((t) => t === 'pass')
          ? 'pass'
          : 'fail',
    },
    protocols: {
      type: StatusEnum,
      description: 'Protocols Status',
      resolve: ({ protocols }) => protocols,
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
