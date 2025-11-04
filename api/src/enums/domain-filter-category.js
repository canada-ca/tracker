import { GraphQLEnumType } from 'graphql'
import { DomainOrderField } from './domain-order-field'

export const DomainFilterCategory = new GraphQLEnumType({
  name: 'DomainFilterCategory',
  description: 'Properties by which domain connections can be filtered.',
  values: {
    ...DomainOrderField.getValues().reduce((acc, { name, value, description }) => {
      acc[name] = { value, description }
      return acc
    }, {}),
    TAGS: {
      value: 'tags',
      description: 'Order domains by tags.',
    },
    ASSET_STATE: {
      value: 'asset-state',
      description: 'Order domains by asset state.',
    },
    GUIDANCE_TAG: {
      value: 'guidance-tag',
      description: 'Scanner findings.',
    },
  },
})
