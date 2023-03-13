import { GraphQLInputObjectType, GraphQLEnumType } from 'graphql'
import {
  ComparisonEnums,
  DomainOrderField,
  DomainTagLabel,
  StatusEnum,
} from '../../enums'

const SecondValEnumsVals = {}
const SecondValEnums = [
  ...StatusEnum.getValues(),
  ...DomainTagLabel.getValues(),
]
SecondValEnums.forEach(
  ({ name, value, description }) =>
    (SecondValEnumsVals[name] = {
      value,
      description,
    }),
)

export const domainFilter = new GraphQLInputObjectType({
  name: 'DomainFilter',
  description:
    'This object is used to provide filtering options when querying org-claimed domains.',
  fields: () => ({
    firstVal: {
      type: DomainOrderField,
      description: 'Category of filter to be applied.',
    },
    comparison: {
      type: ComparisonEnums,
      description: 'First value equals or does not equal second value.',
    },
    secondVal: {
      type: new GraphQLEnumType({
        name: 'SecondValEnums',
        values: SecondValEnumsVals,
        description: '',
      }),
      description: 'Status type or tag label.',
    },
  }),
})
