import { GraphQLObjectType, GraphQLString } from 'graphql'
import { EnrollmentStatusEnums, SeverityEnum, CvdRequirementEnums } from '../../../enums'
import { cvdEnrollment } from '../cvd-enrollment'

describe('cvdEnrollment GraphQLObjectType', () => {
  it('should be an instance of GraphQLObjectType', () => {
    expect(cvdEnrollment).toBeInstanceOf(GraphQLObjectType)
  })

  it('should have the correct name and description', () => {
    expect(cvdEnrollment.name).toBe('CvdEnrollment')
    expect(cvdEnrollment.description).toBe('Represents the CVD enrollment details for a domain asset.')
  })

  describe('fields', () => {
    const fields = cvdEnrollment.getFields()

    it('should include all expected fields', () => {
      expect(fields).toHaveProperty('status')
      expect(fields).toHaveProperty('description')
      expect(fields).toHaveProperty('reference')
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

    it('should have correct type and description for reference', () => {
      expect(fields.reference.type).toBe(GraphQLString)
    })
  })
})
