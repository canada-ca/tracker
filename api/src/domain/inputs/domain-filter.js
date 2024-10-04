import { GraphQLInputObjectType, GraphQLEnumType } from 'graphql'
import { AssetStateEnums, ComparisonEnums, DomainOrderField, DomainTagLabel, StatusEnum } from '../../enums'

const filterValueEnumsVals = {}
const filterValueEnums = [...StatusEnum.getValues(), ...DomainTagLabel.getValues(), ...AssetStateEnums.getValues()]
filterValueEnums.forEach(
  ({ name, value, description }) =>
    (filterValueEnumsVals[name] = {
      value,
      description,
    }),
)

export const domainFilter = new GraphQLInputObjectType({
  name: 'DomainFilter',
  description: 'This object is used to provide filtering options when querying org-claimed domains.',
  fields: () => ({
    filterCategory: {
      type: DomainOrderField,
      description: 'Category of filter to be applied.',
    },
    comparison: {
      type: ComparisonEnums,
      description: 'First value equals or does not equal second value.',
    },
    filterValue: {
      type: new GraphQLEnumType({
        name: 'filterValueEnums',
        values: filterValueEnumsVals,
        description: '',
      }),
      description: 'Status type or tag label.',
    },
  }),
})
