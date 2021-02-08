import { GraphQLEnumType } from 'graphql'

export const OrganizationOrderField = new GraphQLEnumType({
  name: 'OrganizationOrderField',
  values: {
    ACRONYM: {
      value: 'acronym',
      description: 'Order organizations by acronym.',
    },
    NAME: {
      value: 'name',
      description: 'Order organizations by name.',
    },
    SLUG: {
      value: 'slug',
      description: 'Order organizations by acronym.',
    },
    ZONE: {
      value: 'zone',
      description: 'Order organizations by acronym.',
    },
    SECTOR: {
      value: 'sector',
      description: 'Order organizations by acronym.',
    },
    COUNTRY: {
      value: 'country',
      description: 'Order organizations by acronym.',
    },
    PROVINCE: {
      value: 'province',
      description: 'Order organizations by acronym.',
    },
    CITY: {
      value: 'city',
      description: 'Order organizations by acronym.',
    },
    VERIFIED: {
      value: 'verified',
      description: 'Order organizations by acronym.',
    },
    SUMMARY_MAIL_PASS: {
      value: 'summary-mail-pass',
      description: 'Order organizations by acronym.',
    },
    SUMMARY_MAIL_FAIL: {
      value: 'summary-mail-fail',
      description: 'Order organizations by acronym.',
    },
    SUMMARY_MAIL_TOTAL: {
      value: 'summary-mail-total',
      description: 'Order organizations by acronym.',
    },
    SUMMARY_WEB_PASS: {
      value: 'summary-web-pass',
      description: 'Order organizations by acronym.',
    },
    SUMMARY_WEB_FAIL: {
      value: 'summary-web-fail',
      description: 'Order organizations by acronym.',
    },
    SUMMARY_WEB_TOTAL: {
      value: 'summary-web-total',
      description: 'Order organizations by acronym.',
    },
    DOMAIN_COUNT: {
      value: 'domain-count',
      description: 'Order organizations by acronym.',
    },
  },
  description: 'Properties by which organization connections can be ordered.',
})
