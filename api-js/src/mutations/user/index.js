const { authenticate } = require('./authenticate')
const { resetPassword } = require('./reset-password')
const { sendEmailVerification } = require('./send-email-verification')
const { sendPasswordResetLink } = require('./send-password-reset')
const { sendPhoneCode } = require('./send-phone-code')
const { signIn } = require('./sign-in')
const { signUp } = require('./sign-up')
const { updateUserPassword } = require('./update-user-password')
const { updateUserProfile } = require('./update-user-profile')
const { verifyAccount } = require('./verify-account')
const { verifyPhoneNumber } = require('./verify-phone-number')

module.exports = {
  authenticate,
  resetPassword,
  sendEmailVerification,
  sendPasswordResetLink,
  sendPhoneCode,
  signIn,
  signUp,
  updateUserPassword,
  updateUserProfile,
  verifyAccount,
  verifyPhoneNumber,
}
