import {
  additionalFinding,
  webConnectionType,
  webComponentLocationType,
  webComponentPortType,
  webComponentCveType,
} from '../additional-finding.js'
import { GraphQLList, GraphQLString } from 'graphql'
import { GraphQLDateTime } from 'graphql-scalars'

describe('additionalFinding', () => {
  it('should have correct fields', () => {
    const fields = additionalFinding.getFields()

    expect(fields.timestamp.type).toBe(GraphQLDateTime)
    expect(fields.timestamp.description).toBe('The date the finding was discovered.')

    expect(fields.locations.type).toBeInstanceOf(GraphQLList)
    expect(fields.locations.description).toBe('The locations the finding was discovered.')

    expect(fields.ports.type).toBeInstanceOf(GraphQLList)
    expect(fields.ports.description).toBe('The ports the finding was discovered.')

    expect(fields.headers.type).toBeInstanceOf(GraphQLList)
    expect(fields.headers.description).toBe('The headers the finding was discovered.')

    expect(fields.webComponents.type).toBeInstanceOf(GraphQLList)
    expect(fields.webComponents.description).toBe('The web components the finding was discovered.')

    expect(fields.vulnerabilities.type).toBeInstanceOf(GraphQLList)
    expect(fields.vulnerabilities.description).toBe('The vulnerabilities the finding was discovered.')
  })
})

describe('webConnectionType', () => {
  it('should have correct fields', () => {
    const fields = webConnectionType.getFields()

    expect(fields.webComponentName.type).toBe(GraphQLString)
    expect(fields.webComponentName.description).toBe('The URL of the web component.')

    expect(fields.webComponentCategory.type).toBe(GraphQLString)
    expect(fields.webComponentCategory.description).toBe('The type of web component.')

    expect(fields.webComponentVersion.type).toBe(GraphQLString)
    expect(fields.webComponentVersion.description).toBe('The status of the web component.')

    expect(fields.webComponentCves.type).toBeInstanceOf(GraphQLList)
    expect(fields.webComponentPorts.type).toBeInstanceOf(GraphQLList)

    expect(fields.webComponentFirstSeen.type).toBe(GraphQLString)
    expect(fields.webComponentLastSeen.type).toBe(GraphQLString)
  })
})

describe('webComponentLocationType', () => {
  it('should have correct fields', () => {
    const fields = webComponentLocationType.getFields()

    expect(fields.region.type).toBe(GraphQLString)
    expect(fields.region.description).toBe('The location of the finding.')

    expect(fields.city.type).toBe(GraphQLString)
    expect(fields.city.description).toBe('The location of the finding.')

    expect(fields.latitude.type).toBe(GraphQLString)
    expect(fields.latitude.description).toBe('The location of the finding.')

    expect(fields.longitude.type).toBe(GraphQLString)
    expect(fields.longitude.description).toBe('The location of the finding.')

    expect(fields.firstSeen.type).toBe(GraphQLString)
    expect(fields.firstSeen.description).toBe('The location of the finding.')

    expect(fields.lastSeen.type).toBe(GraphQLString)
    expect(fields.lastSeen.description).toBe('The location of the finding.')
  })
})

describe('webComponentPortType', () => {
  it('should have correct fields', () => {
    const fields = webComponentPortType.getFields()

    expect(fields.port.type).toBe(GraphQLString)
    expect(fields.port.description).toBe('The port the finding was discovered.')

    expect(fields.lastPortState.type).toBe(GraphQLString)
    expect(fields.lastPortState.description).toBe('The protocol the finding was discovered.')

    expect(fields.portStateFirstSeen.type).toBe(GraphQLString)
    expect(fields.portStateFirstSeen.description).toBe('The date the finding was discovered.')

    expect(fields.portStateLastSeen.type).toBe(GraphQLString)
    expect(fields.portStateLastSeen.description).toBe('The date the finding was discovered.')
  })
})

describe('webComponentCveType', () => {
  it('should have correct fields', () => {
    const fields = webComponentCveType.getFields()

    expect(fields.cve.type).toBe(GraphQLString)
    expect(fields.cve.description).toBe('The CVE of the finding.')

    expect(fields.cwe.type).toBe(GraphQLString)
    expect(fields.cwe.description).toBe('The description of the CVE.')

    expect(fields.cvssScore.type).toBe(GraphQLString)
    expect(fields.cvssScore.description).toBe('The severity of the CVE.')

    expect(fields.cvss3Score.type).toBe(GraphQLString)
    expect(fields.cvss3Score.description).toBe('The severity of the CVE.')
  })
})
