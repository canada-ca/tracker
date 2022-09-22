import {GraphQLObjectType, GraphQLString} from 'graphql'

export const refLinksType = new GraphQLObjectType({
  name: 'RefLinks',
  description:
    'Object containing the information of various links for guidance or technical documentation.',
  fields: () => ({
    description: {
      type: GraphQLString,
      description: 'Title of the guidance link.',
      resolve: ({description}) => description,
    },
    refLink: {
      type: GraphQLString,
      description: 'URL for the guidance documentation.',
      resolve: ({ref_link: refLink}) => refLink,
    },
  }),
})
