import { GraphQLEnumType } from 'graphql'
import { StatusEnum } from './status'
import { DomainTagLabel } from './domain-tag-label'
import { AssetStateEnums } from './asset-state'
import { DmarcPhaseEnum } from './dmarc-phase'

const getEnumValues = (enums) => {
  return enums.getValues().reduce((acc, { name, value, description }) => {
    acc[name] = { value, description }
    return acc
  }, {})
}

export const filterEnum = new GraphQLEnumType({
  name: 'SystemFilterValue',
  values: {
    ...getEnumValues(StatusEnum),
    ...getEnumValues(DomainTagLabel),
    ...getEnumValues(AssetStateEnums),
    ...getEnumValues(DmarcPhaseEnum),
  },
  description: 'Filter value from system-defined statuses or tags.',
})
