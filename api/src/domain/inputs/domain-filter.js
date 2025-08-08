import { GraphQLInputObjectType } from 'graphql'
import { ComparisonEnums, DomainOrderField } from '../../enums'
import { FilterValueScalar } from '../../scalars/filter-value'

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
      type: FilterValueScalar,
      description: 'Status type or tag label.',
    },
  }),
})
