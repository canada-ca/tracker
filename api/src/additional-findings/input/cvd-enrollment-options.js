import { GraphQLInputObjectType } from 'graphql'
import { cvdEnrollmentFields } from '../objects/cvd-enrollment'

export const CvdEnrollmentInputOptions = new GraphQLInputObjectType({
  name: 'CvdEnrollmenInputOptions',
  description:
    'Input options for specifying CVD enrollment details, including program status and CVSS environmental requirements.',
  fields: () => ({ ...cvdEnrollmentFields }),
})
