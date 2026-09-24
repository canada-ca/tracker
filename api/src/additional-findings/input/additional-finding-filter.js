import { GraphQLInputObjectType } from 'graphql'

import { ComparisonEnums, AdditionalFindingFilterCategory } from '../../enums'
import { FilterValueScalar } from '../../scalars/filter-value'

export const additionalFindingFilter = new GraphQLInputObjectType({
  name: 'AdditionalFindingFilter',
  description: 'This object is used to provide filtering options when querying additional findings.',
  fields: () => ({
    filterCategory: {
      type: AdditionalFindingFilterCategory,
      description: 'Category of filter to be applied.',
    },
    comparison: {
      type: ComparisonEnums,
      description: 'First value equals or does not equal second value.',
    },
    filterValue: {
      type: FilterValueScalar,
      description: 'Additional finding filter value.',
    },
  }),
})
