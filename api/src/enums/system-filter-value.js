import { GraphQLEnumType } from 'graphql'
import { StatusEnum } from './status'
import { DomainTagLabel } from './domain-tag-label'
import { AssetStateEnums } from './asset-state'

export const filterEnum = new GraphQLEnumType({
  name: 'SystemFilterValue',
  values: {
    ...StatusEnum.getValues().reduce((acc, { name, value, description }) => {
      acc[name] = { value, description }
      return acc
    }, {}),
    ...DomainTagLabel.getValues().reduce((acc, { name, value, description }) => {
      acc[name] = { value, description }
      return acc
    }, {}),
    ...AssetStateEnums.getValues().reduce((acc, { name, value, description }) => {
      acc[name] = { value, description }
      return acc
    }, {}),
  },
  description: 'Filter value from system-defined statuses or tags.',
})
