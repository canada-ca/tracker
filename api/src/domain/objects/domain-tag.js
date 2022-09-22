import {GraphQLObjectType, GraphQLString} from 'graphql'
import {SeverityEnum} from '../../enums'

export const domainTag = new GraphQLObjectType({
  name: 'DomainTag',
  description:
    'This object contains information about a vulnerability affecting the domain.',
  fields: () => ({
    id: {
      type: GraphQLString,
      description: 'CVE ID of the detected vulnerability.',
      resolve: ({id}) => id,
    },
    firstDetected: {
      type: GraphQLString,
      description: 'Time that the vulnerability was first scanned',
      resolve: ({firstDetected}) => firstDetected,
    },
    severity: {
      type: SeverityEnum,
      description: 'Protocols Status',
      resolve: ({severity}) => severity,
    },
  }),
})
