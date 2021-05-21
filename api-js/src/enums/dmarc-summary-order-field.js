import { GraphQLEnumType } from 'graphql'

export const DmarcSummaryOrderField = new GraphQLEnumType({
  name: 'DmarcSummaryOrderField',
  values: {
    FAIL: {
      value: 'fail-count',
      description: 'Order dmarc summaries by fail count.',
    },
    FULL_PASS: {
      value: 'pass-count',
      description: 'Order dmarc summaries by pass count.',
    },
    PASS_DKIM_ONLY: {
      value: 'pass-dkim-count',
      description: 'Order dmarc summaries by pass dkim only count.',
    },
    PASS_SPF_ONLY: {
      value: 'pass-spf-count',
      description: 'Order dmarc summaries by pass spf only count.',
    },
    FAIL_PERCENTAGE: {
      value: 'fail-percentage',
      description: 'Order dmarc summaries by fail percentage.',
    },
    FULL_PASS_PERCENTAGE: {
      value: 'pass-percentage',
      description: 'Order dmarc summaries by pass percentage.',
    },
    PASS_DKIM_ONLY_PERCENTAGE: {
      value: 'pass-dkim-percentage',
      description: 'Order dmarc summaries by pass dkim only percentage.',
    },
    PASS_SPF_ONLY_PERCENTAGE: {
      value: 'pass-spf-percentage',
      description: 'Order dmarc summaries by spf only percentage.',
    },
    TOTAL_MESSAGES: {
      value: 'total-messages',
      description: 'Order dmarc summaries by total messages',
    },
    DOMAIN: {
      value: 'domain',
      description: 'Order dmarc summaries by their respective domains.',
    },
  },
  description: 'Properties by which dmarc summary connections can be ordered.',
})
