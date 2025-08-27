import { GraphQLEnumType } from 'graphql'

export const DomainOrderField = new GraphQLEnumType({
  name: 'DomainOrderField',
  description: 'Properties by which domain connections can be ordered.',
  values: {
    CERTIFICATES_STATUS: {
      value: 'certificates-status',
      description: 'Order domains by certificates status.',
    },
    CIPHERS_STATUS: {
      value: 'ciphers-status',
      description: 'Order domains by ciphers status.',
    },
    CURVES_STATUS: {
      value: 'curves-status',
      description: 'Order domains by curves status.',
    },
    DOMAIN: {
      value: 'domain',
      description: 'Order domains by domain.',
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
    HSTS_STATUS: {
      value: 'hsts-status',
      description: 'Order domains by hsts status.',
    },
    POLICY_STATUS: {
      value: 'policy-status',
      description: 'Order domains by ITPIN policy status.',
    },
    PROTOCOLS_STATUS: {
      value: 'protocols-status',
      description: 'Order domains by protocols status.',
    },
    SPF_STATUS: {
      value: 'spf-status',
      description: 'Order domains by spf status.',
    },
  },
})
