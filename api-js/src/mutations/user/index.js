const { authenticate } = require('./authenticate')
const { resetPassword } = require('./reset-password')
const { sendEmailVerification } = require('./send-email-verification')
const { sendPasswordResetLink } = require('./send-password-reset')
const { sendTFATextMsg } = require('./send-tfa-code')
const { signUp } = require('./sign-up')
const { updateUserPassword } = require('./update-user-password')
const { updateUserProfile } = require('./update-user-profile')
const { verifyAccount } = require('./verify-account')

module.exports = {
  authenticate,
  resetPassword,
  sendEmailVerification,
  sendPasswordResetLink,
  sendTFATextMsg,
  signUp,
  updateUserPassword,
  updateUserProfile,
  verifyAccount,
}
