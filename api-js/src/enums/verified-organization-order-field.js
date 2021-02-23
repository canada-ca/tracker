import { GraphQLEnumType } from 'graphql'

export const VerifiedOrganizationOrderField = new GraphQLEnumType({
  name: 'VerifiedOrganizationOrderField',
  description:
    'Properties by which verified organization connections can be ordered.',
  values: {
    ACRONYM: {
      value: 'acronym',
      description: 'Order verified organization edges by acronym.',
    },
    NAME: {
      value: 'name',
      description: 'Order verified organization edges by name.',
    },
    ZONE: {
      value: 'zone',
      description: 'Order verified organization edges by zone.',
    },
    SECTOR: {
      value: 'sector',
      description: 'Order verified organization edges by sector.',
    },
    COUNTRY: {
      value: 'country',
      description: 'Order verified organization edges by country.',
    },
    SUMMARY_MAIL_PASS: {
      value: 'summary-mail-pass',
      description: 'Order verified organizations by summary mail pass count.',
    },
    SUMMARY_MAIL_FAIL: {
      value: 'summary-mail-fail',
      description: 'Order verified organizations by summary mail fail count.',
    },
    SUMMARY_MAIL_TOTAL: {
      value: 'summary-mail-total',
      description: 'Order verified organizations by summary mail total count.',
    },
    SUMMARY_WEB_PASS: {
      value: 'summary-web-pass',
      description: 'Order verified organizations by summary web pass count.',
    },
    SUMMARY_WEB_FAIL: {
      value: 'summary-web-fail',
      description: 'Order verified organizations by summary web fail count.',
    },
    SUMMARY_WEB_TOTAL: {
      value: 'summary-web-total',
      description: 'Order verified organizations by summary web total count.',
    },
    DOMAIN_COUNT: {
      value: 'domain-count',
      description: 'Order verified organizations by domain count.',
    },
  },
})
