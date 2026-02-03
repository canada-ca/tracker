import { GraphQLObjectType, GraphQLString } from 'graphql'
import { EnrollmentStatusEnums, SeverityEnum, CvdRequirementEnums } from '../../../enums'
import { cvdEnrollment } from '../cvd-enrollment'

describe('cvdEnrollment GraphQLObjectType', () => {
  it('should be an instance of GraphQLObjectType', () => {
    expect(cvdEnrollment).toBeInstanceOf(GraphQLObjectType)
  })

  it('should have the correct name and description', () => {
    expect(cvdEnrollment.name).toBe('CvdEnrollment')
    expect(cvdEnrollment.description).toBe(
      'Represents the CVD enrollment details for a domain asset, including enrollment status and CVSS environmental requirements.',
    )
  })

  describe('fields', () => {
    const fields = cvdEnrollment.getFields()

    it('should include all expected fields', () => {
      expect(fields).toHaveProperty('status')
      expect(fields).toHaveProperty('description')
      expect(fields).toHaveProperty('maxSeverity')
      expect(fields).toHaveProperty('confidentialityRequirement')
      expect(fields).toHaveProperty('integrityRequirement')
      expect(fields).toHaveProperty('availabilityRequirement')
    })

    it('should have correct type and description for status', () => {
      expect(fields.status.type).toBe(EnrollmentStatusEnums)
      expect(fields.status.description).toBe(
        'The enrollment status of the asset in the Coordinated Vulnerability Disclosure (CVD) program.',
      )
    })

    it('should have correct type and description for description', () => {
      expect(fields.description.type).toBe(GraphQLString)
      expect(fields.description.description).toBe('The asset description.')
    })

    it('should have correct type and description for maxSeverity', () => {
      expect(fields.maxSeverity.type).toBe(SeverityEnum)
      expect(fields.maxSeverity.description).toContain('qualitative rating')
    })

    it('should have correct type and description for confidentialityRequirement', () => {
      expect(fields.confidentialityRequirement.type).toBe(CvdRequirementEnums)
      expect(fields.confidentialityRequirement.description).toContain('Confidentiality Impact')
    })

    it('should have correct type and description for integrityRequirement', () => {
      expect(fields.integrityRequirement.type).toBe(CvdRequirementEnums)
      expect(fields.integrityRequirement.description).toContain('Integrity Impact')
    })

    it('should have correct type and description for availabilityRequirement', () => {
      expect(fields.availabilityRequirement.type).toBe(CvdRequirementEnums)
      expect(fields.availabilityRequirement.description).toContain('Availability Impact')
    })
  })
})
