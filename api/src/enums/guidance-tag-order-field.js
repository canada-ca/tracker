import { GraphQLEnumType } from 'graphql'

export const GuidanceTagOrderField = new GraphQLEnumType({
  name: 'GuidanceTagOrderField',
  description: 'Properties by which Guidance Tag connections can be ordered.',
  values: {
    TAG_ID: {
      value: 'tag-id',
      description: 'Order guidance tag edges by tag id.',
    },
    TAG_NAME: {
      value: 'tag-name',
      description: 'Order guidance tag edges by tag name.',
    },
    GUIDANCE: {
      value: 'guidance',
      description: 'Order guidance tag edges by tag guidance.',
    },
    TAG_COUNT: {
      value: 'tag-count',
      description: 'Order guidance tag edges by tag count.',
    },
  },
})
