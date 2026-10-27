import { GraphQLObjectType, GraphQLString } from 'graphql'
import { EnrollmentStatusEnums } from '../../enums'

export const cvdEnrollmentFields = {
  status: {
    description: 'The enrollment status of the asset in the Coordinated Vulnerability Disclosure (CVD) program.',
    type: EnrollmentStatusEnums,
  },
  description: {
    description: 'The asset description.',
    type: GraphQLString,
  },
  reference: {
    description: 'The customer defined reference identifier or tag of the asset.',
    type: GraphQLString,
  },
}

export const cvdEnrollment = new GraphQLObjectType({
  name: 'CvdEnrollment',
  description: 'Represents the CVD enrollment details for a domain asset.',
  fields: () => ({ ...cvdEnrollmentFields }),
})
