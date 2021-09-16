import { GraphQLObjectType } from 'graphql'
import { StatusEnum } from '../../enums'

export const domainStatus = new GraphQLObjectType({
  name: 'DomainStatus',
  description:
    'This object contains how the domain is doing on the various scans we preform, based on the latest scan data.',
  fields: () => ({
    certificates: {
      type: StatusEnum,
      description: 'Certificate Status',
      resolve: ({ certificates }) => certificates,
    },
    ciphers: {
      type: StatusEnum,
      description: 'Cipher Status',
      resolve: ({ ciphers }) => ciphers,
    },
    curves: {
      type: StatusEnum,
      description: 'Curve Status',
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
    hsts: {
      type: StatusEnum,
      description: 'HSTS Status',
      resolve: ({ hsts }) => hsts,
    },
    https: {
      type: StatusEnum,
      description: 'HTTPS Status',
      resolve: ({ https }) => https,
    },
    policy: {
      type: StatusEnum,
      description: 'Policy Status',
      resolve: ({ policy }) => policy,
    },
    protocols: {
      type: StatusEnum,
      description: 'Protocol Status',
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
