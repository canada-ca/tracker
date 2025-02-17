import { GraphQLObjectType, GraphQLList, GraphQLString } from 'graphql'
import { GraphQLDateTime } from 'graphql-scalars'

export const additionalFinding = new GraphQLObjectType({
  name: 'AdditionalFinding',
  fields: () => ({
    timestamp: {
      type: GraphQLDateTime,
      description: `The date the finding was discovered.`,
      resolve: ({ timestamp }) => new Date(timestamp),
    },
    locations: {
      type: new GraphQLList(webComponentLocationType),
      description: `The locations the finding was discovered.`,
      resolve: ({ locations }) => locations,
    },
    ports: {
      type: new GraphQLList(webComponentPortType),
      description: `The ports the finding was discovered.`,
      resolve: ({ ports }) => ports,
    },
    headers: {
      type: new GraphQLList(GraphQLString),
      description: `The headers the finding was discovered.`,
      resolve: ({ headers }) => headers,
    },
    webComponents: {
      type: new GraphQLList(webConnectionType),
      description: `The web components the finding was discovered.`,
      resolve: ({ webComponents }) => webComponents,
    },
    vulnerabilities: {
      type: new GraphQLList(webComponentCveType),
      description: `The vulnerabilities the finding was discovered.`,
      resolve: ({ webComponents }) => {
        const vulnerabilities = []
        for (const webComponent of webComponents) {
          vulnerabilities.push(...webComponent.WebComponentCves)
        }

        const jsonObject = vulnerabilities.map(JSON.stringify)
        const uniqueSet = new Set(jsonObject)
        const uniqueVulns = Array.from(uniqueSet).map(JSON.parse)
        uniqueVulns.sort((a, b) => Number(a.Cvss3Score) - Number(b.Cvss3Score))

        return uniqueVulns
      },
    },
  }),
  description: `A finding imported from an external ASM tool.`,
})

export const webConnectionType = new GraphQLObjectType({
  name: 'WebConnectionType',
  fields: () => ({
    webComponentName: {
      type: GraphQLString,
      description: `The URL of the web component.`,
      resolve: ({ WebComponentName }) => WebComponentName,
    },
    webComponentCategory: {
      type: GraphQLString,
      description: `The type of web component.`,
      resolve: ({ WebComponentCategory }) => WebComponentCategory,
    },
    webComponentVersion: {
      type: GraphQLString,
      description: `The status of the web component.`,
      resolve: ({ WebComponentVersion }) => WebComponentVersion,
    },
    webComponentCves: {
      type: new GraphQLList(webComponentCveType),
      description: '',
      resolve: ({ WebComponentCves }) => WebComponentCves,
    },
    webComponentPorts: {
      type: new GraphQLList(webComponentPortType),
      description: '',
      resolve: ({ WebComponentPorts }) => WebComponentPorts,
    },
    webComponentFirstSeen: {
      type: GraphQLString,
      description: '',
      resolve: ({ WebComponentFirstSeen }) => WebComponentFirstSeen,
    },
    webComponentLastSeen: {
      type: GraphQLString,
      description: '',
      resolve: ({ WebComponentLastSeen }) => WebComponentLastSeen,
    },
  }),
})

export const webComponentLocationType = new GraphQLObjectType({
  name: 'WebComponentLocation',
  fields: () => ({
    region: {
      type: GraphQLString,
      description: `The location of the finding.`,
      resolve: ({ Region }) => Region,
    },
    city: {
      type: GraphQLString,
      description: `The location of the finding.`,
      resolve: ({ City }) => City,
    },
    latitude: {
      type: GraphQLString,
      description: `The location of the finding.`,
      resolve: ({ Latitude }) => Latitude,
    },
    longitude: {
      type: GraphQLString,
      description: `The location of the finding.`,
      resolve: ({ Longitude }) => Longitude,
    },
    firstSeen: {
      type: GraphQLString,
      description: `The location of the finding.`,
      resolve: ({ FirstSeen }) => FirstSeen,
    },
    lastSeen: {
      type: GraphQLString,
      description: `The location of the finding.`,
      resolve: ({ LastSeen }) => LastSeen,
    },
  }),
})

export const webComponentPortType = new GraphQLObjectType({
  name: 'WebComponentPort',
  fields: () => ({
    port: {
      type: GraphQLString,
      description: `The port the finding was discovered.`,
      resolve: ({ Port }) => Port,
    },
    lastPortState: {
      type: GraphQLString,
      description: `The protocol the finding was discovered.`,
      resolve: ({ LastPortState }) => LastPortState,
    },
    portStateFirstSeen: {
      type: GraphQLString,
      description: `The date the finding was discovered.`,
      resolve: ({ PortStateFirstSeen }) => PortStateFirstSeen,
    },
    portStateLastSeen: {
      type: GraphQLString,
      description: `The date the finding was discovered.`,
      resolve: ({ PortStateLastSeen }) => PortStateLastSeen,
    },
  }),
})

export const webComponentCveType = new GraphQLObjectType({
  name: 'WebComponentCVE',
  fields: () => ({
    cve: {
      type: GraphQLString,
      description: `The CVE of the finding.`,
      resolve: ({ Cve }) => Cve,
    },
    cwe: {
      type: GraphQLString,
      description: `The description of the CVE.`,
      resolve: ({ Cwe }) => Cwe,
    },
    cvssScore: {
      type: GraphQLString,
      description: `The severity of the CVE.`,
      resolve: ({ CvssScore }) => CvssScore,
    },
    cvss3Score: {
      type: GraphQLString,
      description: `The severity of the CVE.`,
      resolve: ({ Cvss3Score }) => Number(Cvss3Score).toFixed(1),
    },
    severity: {
      type: GraphQLString,
      description: `The severity of the CVE.`,
      resolve: ({ Cvss3Score }) => {
        const score = Number(Cvss3Score)
        if (score >= 9) return 'critical'
        else if (score >= 7 && score < 9) return 'high'
        else if (score >= 4 && score < 7) return 'medium'
        else return 'low'
      },
    },
    confidenceLevel: {
      type: GraphQLString,
      description: 'Level of confidence that finding is accurate.',
      resolve: ({ ConfidenceLevel }) => ConfidenceLevel,
    },
  }),
})
