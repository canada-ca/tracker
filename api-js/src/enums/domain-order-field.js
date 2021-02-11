import { GraphQLEnumType } from 'graphql'

export const DomainOrderField = new GraphQLEnumType({
  name: 'DomainOrderField',
  description: 'Properties by which domain connections can be ordered.',
  values: {
    DOMAIN: {
      value: 'domain',
      description: 'Order domains by domain.',
    },
    LAST_RAN: {
      value: 'last-ran',
      description: 'Order domains by last ran.',
    },
    DKIM_STATUS: {
      value: 'dkim-status',
      description: 'Order domains by dkim status.',
    },
    DMARC_STATUS: {
      value: 'dmarc-status',
      description: 'Order domains by dmarc status.',
    },
    HTTPS_STATUS: {
      value: 'https-status',
      description: 'Order domains by https status.',
    },
    SPF_STATUS: {
      value: 'spf-status',
      description: 'Order domains by spf status.',
    },
    SSL_STATUS: {
      value: 'ssl-status',
      description: 'Order domains by ssl status.',
    },
  },
})
