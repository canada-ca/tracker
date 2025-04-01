import { GraphQLBoolean, GraphQLObjectType, GraphQLString } from 'graphql'
import { TagOwnershipEnums } from '../../enums/tag-ownership'

export const tagType = new GraphQLObjectType({
  name: 'Tag',
  fields: () => ({
    tagId: {
      type: GraphQLString,
      description: 'A unique identifier for the tag.',
      resolve: ({ tagId }) => tagId,
    },
    label: {
      type: GraphQLString,
      description: 'The display name or label of the tag.',
      resolve: ({ label }) => label,
    },
    description: {
      type: GraphQLString,
      description: 'A brief description of the tag.',
      resolve: ({ description }) => description,
    },
    isVisible: {
      type: GraphQLBoolean,
      description: 'Indicates whether the tag is visible to users.',
      resolve: ({ visible }) => visible,
    },
    ownership: {
      type: TagOwnershipEnums,
      description: '',
      resolve: ({ ownership }) => ownership,
    },
  }),
})
