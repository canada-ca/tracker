import { GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'
import { PhpStatusEnum } from '../../enums'
import { CveID } from '../../scalars'

export const phpResultType = new GraphQLObjectType({
  name: 'PhpResult',
  description:
    "PHP seen in the domain's own responses in the latest web scan, checked against the open PHP advisories.",
  fields: () => ({
    status: {
      type: PhpStatusEnum,
      description: 'Whether the PHP version shown is affected by an open advisory.',
      resolve: ({ status }) => status,
    },
    version: {
      type: GraphQLString,
      description: 'The PHP version that decided the status, as the server showed it.',
      resolve: ({ version }) => version,
    },
    advisories: {
      type: new GraphQLList(GraphQLString),
      description: 'The open advisories that affect the version shown.',
      resolve: ({ advisories }) => advisories,
    },
    cves: {
      type: new GraphQLList(CveID),
      description: 'The CVEs of the open advisories that affect the version shown.',
      resolve: ({ cves }) => cves,
    },
    evidence: {
      type: new GraphQLList(GraphQLString),
      description: 'What was seen in the responses that shows PHP.',
      resolve: ({ evidence }) => evidence,
    },
  }),
})
