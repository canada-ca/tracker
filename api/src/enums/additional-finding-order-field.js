import { GraphQLEnumType } from 'graphql'

export const AdditionalFindingOrderField = new GraphQLEnumType({
  name: 'AdditionalFindingOrderField',
  description: 'Properties by which additional findings can be ordered.',
  values: {
    SOURCE: {
      value: 'source',
      description: 'Order additional findings by source.',
    },
    FINDING_TYPE: {
      value: 'findingType',
      description: 'Order additional findings by finding type.',
    },
    SUBJECT: {
      value: 'subject',
      description: 'Order additional findings by subject.',
    },
    CONFIDENCE: {
      value: 'confidence',
      description: 'Order additional findings by confidence.',
    },
    SEVERITY: {
      value: 'severity',
      description: 'Order additional findings by severity.',
    },
    REASON_CODE: {
      value: 'reasonCode',
      description: 'Order additional findings by reason code.',
    },
    FIRST_SEEN: {
      value: 'firstSeen',
      description: 'Order additional findings by first seen.',
    },
    LAST_SEEN: {
      value: 'lastSeen',
      description: 'Order additional findings by last seen.',
    },
    OCCURENCE_COUNT: {
      value: 'occurenceCount',
      description: 'Order additional findings by occurence count.',
    },
    STATUS: {
      value: 'status',
      description: 'Order additional findings by status.',
    },
  },
})
