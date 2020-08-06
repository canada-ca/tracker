const { GraphQLObjectType } = require('graphql')
// const { i18n: internationalization } = require('lingui-i18n')

const { createDomain, removeDomain, updateDomain } = require('./domain')
const {
  createOrganization,
  removeOrganization,
  updateOrganization,
} = require('./organizations')
const { requestScan } = require('./scans')
const {
  authenticate,
  resetPassword,
  sendEmailVerification,
  sendPasswordResetLink,
  sendTFATextMsg,
  signUp,
  updateUserPassword,
  updateUserProfile,
  verifyAccount,
  verifyTwoFactorAuthentication,
} = require('./user')

const { inviteUserToOrg, updateUserRole } = require('./user-affiliations')

// const createMutationSchema = i18n => {
const createMutationSchema = () => {
  return new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
      // Domain Mutations
      createDomain,
      removeDomain,
      updateDomain,
      // Organization Mutations
      createOrganization,
      removeOrganization,
      updateOrganization,
      // Scan Mutations
      requestScan,
      // User Mutations
      authenticate,
      resetPassword,
      sendEmailVerification,
      sendPasswordResetLink,
      sendTFATextMsg,
      signUp,
      updateUserPassword,
      updateUserProfile,
      verifyAccount,
      verifyTwoFactorAuthentication,
      // User Affiliations Mutations
      inviteUserToOrg,
      updateUserRole,
    }),
  })
}

module.exports = {
  createMutationSchema,
}
