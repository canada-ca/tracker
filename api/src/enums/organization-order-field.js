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
      description: 'Order organizations by slug.',
    },
    ZONE: {
      value: 'zone',
      description: 'Order organizations by zone.',
    },
    SECTOR: {
      value: 'sector',
      description: 'Order organizations by sector.',
    },
    COUNTRY: {
      value: 'country',
      description: 'Order organizations by country.',
    },
    PROVINCE: {
      value: 'province',
      description: 'Order organizations by province.',
    },
    CITY: {
      value: 'city',
      description: 'Order organizations by city.',
    },
    VERIFIED: {
      value: 'verified',
      description: 'Order organizations by verified.',
    },
    SUMMARY_MAIL_PASS: {
      value: 'summary-mail-pass',
      description: 'Order organizations by summary mail pass count.',
    },
    SUMMARY_MAIL_FAIL: {
      value: 'summary-mail-fail',
      description: 'Order organizations by summary mail fail count.',
    },
    SUMMARY_MAIL_TOTAL: {
      value: 'summary-mail-total',
      description: 'Order organizations by summary mail total count.',
    },
    SUMMARY_WEB_PASS: {
      value: 'summary-web-pass',
      description: 'Order organizations by summary web pass count.',
    },
    SUMMARY_WEB_FAIL: {
      value: 'summary-web-fail',
      description: 'Order organizations by summary web fail count.',
    },
    SUMMARY_WEB_TOTAL: {
      value: 'summary-web-total',
      description: 'Order organizations by summary web total count.',
    },
    DOMAIN_COUNT: {
      value: 'domain-count',
      description: 'Order organizations by domain count.',
    },
  },
  description: 'Properties by which organization connections can be ordered.',
})
