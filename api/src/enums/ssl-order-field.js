import {GraphQLEnumType} from 'graphql'

export const SslOrderField = new GraphQLEnumType({
  name: 'SSLOrderField',
  description: 'Properties by which SSL connections can be ordered.',
  values: {
    ACCEPTABLE_CIPHERS: {
      value: 'acceptable-ciphers',
      description: 'Order SSL edges by their acceptable ciphers.',
    },
    ACCEPTABLE_CURVES: {
      value: 'acceptable-curves',
      description: 'Order SSL edges by their acceptable curves.',
    },
    CCS_INJECTION_VULNERABLE: {
      value: 'ccs-injection-vulnerable',
      description: 'Order SSL edges by ccs-injection-vulnerable.',
    },
    HEARTBLEED_VULNERABLE: {
      value: 'heartbleed-vulnerable',
      description: 'Order SSL edges by heart-bleed-vulnerable.',
    },
    STRONG_CIPHERS: {
      value: 'strong-ciphers',
      description: 'Order SSL edges by their strong ciphers.',
    },
    STRONG_CURVES: {
      value: 'strong-curves',
      description: 'Order SSL edges by their strong curves.',
    },
    SUPPORTS_ECDH_KEY_EXCHANGE: {
      value: 'supports-ecdh-key-exchange',
      description: 'Order SSL edges by supports-ecdh-key-exchange.',
    },
    TIMESTAMP: {
      value: 'timestamp',
      description: 'Order SSL edges by timestamp.',
    },
    WEAK_CIPHERS: {
      value: 'weak-ciphers',
      description: 'Order SSL edges by their weak ciphers.',
    },
    WEAK_CURVES: {
      value: 'weak-curves',
      description: 'Order SSL edges by their weak curves.',
    },
  },
})
