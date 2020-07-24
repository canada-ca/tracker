const { GraphQLObjectType } = require('graphql')

const { createDomain, removeDomain, updateDomain } = require('./domain')
const {
  createOrganization,
  removeOrganization,
  updateOrganization,
} = require('./organizations')
const { requestScan } = require('./scans')
const {
  authenticate,
  generateOtpUrl,
  resetPassword,
  sendEmailVerification,
  sendPasswordResetLink,
  signUp,
  updateUserPassword,
  updateUserProfile,
  verifyAccount,
} = require('./user')

const { inviteUserToOrg, updateUserRole } = require('./user-affiliations')

const mutation = new GraphQLObjectType({
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
    generateOtpUrl,
    resetPassword,
    sendEmailVerification,
    sendPasswordResetLink,
    signUp,
    updateUserPassword,
    updateUserProfile,
    verifyAccount,
    // User Affiliations Mutations
    inviteUserToOrg,
    updateUserRole,
  }),
})

module.exports = {
  mutation,
}
