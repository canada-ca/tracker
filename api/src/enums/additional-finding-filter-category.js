import { GraphQLEnumType } from 'graphql'
import { AdditionalFindingOrderField } from './additional-finding-order-field'

export const AdditionalFindingFilterCategory = new GraphQLEnumType({
  name: 'AdditionalFindingFilterCategory',
  description: 'Properties by which additional findings can be filtered.',
  values: {
    ...AdditionalFindingOrderField.getValues().reduce((acc, { name, value, description }) => {
      acc[name] = { value, description }
      return acc
    }, {}),
    DOMAIN: {
      value: 'domain',
      description: 'Filter additional findings by domain.',
    },
  },
})
