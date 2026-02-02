import { GraphQLEnumType } from 'graphql'

export const EnrollmentStatusEnums = new GraphQLEnumType({
  name: 'EnrollmentStatusEnums',
  values: {
    ENROLLED: {
      value: 'enrolled',
      description: 'The asset is enrolled in the CVD program and eligible for coordinated vulnerability disclosure.',
    },
    PENDING: {
      value: 'pending',
      description: 'The asset enrollment is pending approval for the CVD program.',
    },
    NOT_ENROLLED: {
      value: 'not-enrolled',
      description: 'The asset is not enrolled in the CVD program.',
    },
  },
  description: 'Enumerates the possible enrollment states for the Coordinated Vulnerability Disclosure (CVD) program.',
})
