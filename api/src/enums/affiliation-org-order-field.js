import {GraphQLEnumType} from 'graphql'

export const AffiliationOrgOrderField = new GraphQLEnumType({
  name: 'AffiliationOrgOrderField',
  description: 'Properties by which affiliation connections can be ordered.',
  values: {
    ORG_ACRONYM: {
      value: 'org-acronym',
      description: 'Order affiliations by org acronym.',
    },
    ORG_NAME: {
      value: 'org-name',
      description: 'Order affiliations by org name.',
    },
    ORG_SLUG: {
      value: 'org-slug',
      description: 'Order affiliations by org slug.',
    },
    ORG_ZONE: {
      value: 'org-zone',
      description: 'Order affiliations by org zone.',
    },
    ORG_SECTOR: {
      value: 'org-sector',
      description: 'Order affiliations by org sector.',
    },
    ORG_COUNTRY: {
      value: 'org-country',
      description: 'Order affiliations by org country.',
    },
    ORG_PROVINCE: {
      value: 'org-province',
      description: 'Order affiliations by org province.',
    },
    ORG_CITY: {
      value: 'org-city',
      description: 'Order affiliations by org city.',
    },
    ORG_VERIFIED: {
      value: 'org-verified',
      description: 'Order affiliations by org verification.',
    },
    ORG_SUMMARY_MAIL_PASS: {
      value: 'org-summary-mail-pass',
      description: 'Order affiliations by org summary mail pass count.',
    },
    ORG_SUMMARY_MAIL_FAIL: {
      value: 'org-summary-mail-fail',
      description: 'Order affiliations by org summary mail fail count.',
    },
    ORG_SUMMARY_MAIL_TOTAL: {
      value: 'org-summary-mail-total',
      description: 'Order affiliations by org summary mail total count.',
    },
    ORG_SUMMARY_WEB_PASS: {
      value: 'org-summary-web-pass',
      description: 'Order affiliations by org summary web pass count.',
    },
    ORG_SUMMARY_WEB_FAIL: {
      value: 'org-summary-web-fail',
      description: 'Order affiliations by org summary web fail count.',
    },
    ORG_SUMMARY_WEB_TOTAL: {
      value: 'org-summary-web-total',
      description: 'Order affiliations by org summary web total count.',
    },
    ORG_DOMAIN_COUNT: {
      value: 'org-domain-count',
      description: 'Order affiliations by org domain count.',
    },
  },
})
