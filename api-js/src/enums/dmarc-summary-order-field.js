import { GraphQLEnumType } from 'graphql'

export const DmarcSummaryOrderField = new GraphQLEnumType({
  name: 'DmarcSummaryOrderField',
  values: {
    FAIL_COUNT: {
      value: 'fail-count',
      description: 'Order dmarc summaries by fail count.',
    },
    PASS_COUNT: {
      value: 'pass-count',
      description: 'Order dmarc summaries by pass count.',
    },
    PASS_DKIM_COUNT: {
      value: 'pass-dkim-count',
      description: 'Order dmarc summaries by pass dkim only count.',
    },
    PASS_SPF_COUNT: {
      value: 'pass-spf-count',
      description: 'Order dmarc summaries by pass spf only count.',
    },
    FAIL_PERCENTAGE: {
      value: 'fail-percentage',
      description: 'Order dmarc summaries by fail percentage.',
    },
    PASS_PERCENTAGE: {
      value: 'pass-percentage',
      description: 'Order dmarc summaries by pass percentage.',
    },
    PASS_DKIM_PERCENTAGE: {
      value: 'pass-dkim-percentage',
      description: 'Order dmarc summaries by pass dkim only percentage.',
    },
    PASS_SPF_PERCENTAGE: {
      value: 'pass-spf-percentage',
      description: 'Order dmarc summaries by spf only percentage.',
    },
  },
  description: 'Properties by which dmarc summary connections can be ordered.',
})
