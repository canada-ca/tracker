import { GraphQLEnumType } from 'graphql'

export const AdditionalFindingOrderField = new GraphQLEnumType({
  name: 'AdditionalFindingOrderField',
  description: 'Properties by which additional finding connections can be ordered.',
  values: {
    LAST_SEEN: { value: 'lastSeen', description: 'Order additional finding edges by last seen date.' },
    FIRST_SEEN: { value: 'firstSeen', description: 'Order additional finding edges by first seen date.' },
    OCCURRENCE_COUNT: { value: 'occurrenceCount', description: 'Order additional finding edges by occurrence count.' },
    CONFIDENCE: { value: 'confidence', description: 'Order additional finding edges by confidence level.' },
    SUBJECT: { value: 'subject', description: 'Order additional finding edges by subject.' },
  },
})
