import {GraphQLEnumType} from 'graphql'

export const VerifiedDomainOrderField = new GraphQLEnumType({
  name: 'VerifiedDomainOrderField',
  description:
    'Properties by which verified domain connections can be ordered.',
  values: {
    DOMAIN: {
      value: 'domain',
      description: 'Order verified domain edges by domain.',
    },
    LAST_RAN: {
      value: 'last-ran',
      description: 'Order verified domain edges by last ran.',
    },
    DKIM_STATUS: {
      value: 'dkim-status',
      description: 'Order verified domain edges by dkim status.',
    },
    DMARC_STATUS: {
      value: 'dmarc-status',
      description: 'Order verified domain edges by dmarc status.',
    },
    HTTPS_STATUS: {
      value: 'https-status',
      description: 'Order verified domain edges by https status.',
    },
    SPF_STATUS: {
      value: 'spf-status',
      description: 'Order verified domain edges by spf status.',
    },
    SSL_STATUS: {
      value: 'ssl-status',
      description: 'Order verified domain edges by ssl status.',
    },
  },
})
