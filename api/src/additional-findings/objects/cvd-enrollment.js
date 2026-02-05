import { GraphQLObjectType, GraphQLString } from 'graphql'
import { EnrollmentStatusEnums, SeverityEnum, CvdRequirementEnums } from '../../enums'

export const cvdEnrollmentFields = {
  status: {
    description: 'The enrollment status of the asset in the Coordinated Vulnerability Disclosure (CVD) program.',
    type: EnrollmentStatusEnums,
  },
  description: {
    description: 'The asset description.',
    type: GraphQLString,
  },
  maxSeverity: {
    description:
      'The qualitative rating of the maximum severity allowed on this asset. Its value is calculated from the combination of all three of the environmental requirements (CR, IR, and AR).',
    type: SeverityEnum,
  },
  confidentialityRequirement: {
    description:
      'A CVSS environmental modifier that reweights Confidentiality Impact of a vulnerability on this asset.',
    type: CvdRequirementEnums,
  },
  integrityRequirement: {
    description: 'A CVSS environmental modifier that reweights Integrity Impact of a vulnerability on this asset.',
    type: CvdRequirementEnums,
  },
  availabilityRequirement: {
    description: 'A CVSS environmental modifier that reweights Availability Impact of a vulnerability on this asset.',
    type: CvdRequirementEnums,
  },
}

export const cvdEnrollment = new GraphQLObjectType({
  name: 'CvdEnrollment',
  description:
    'Represents the CVD enrollment details for a domain asset, including enrollment status and CVSS environmental requirements.',
  fields: () => ({ ...cvdEnrollmentFields }),
})
