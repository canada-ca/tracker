/* eslint-disable */ module.exports = {
  languageData: {
    plurals: function (n, ord) {
      if (ord) return n == 1 ? 'one' : 'other'
      return n >= 0 && n < 2 ? 'one' : 'other'
    },
  },
  messages: {
    'Authentication error, please sign in again.': 'todo',
    'If an account with this username is found, a password reset link will be found in your inbox.':
      'todo',
    'If an account with this username is found, an email verification link will be found in your inbox.':
      'todo',
    'New passwords do not match. Please try again.': 'todo',
    'Password is not strong enough. Please try again.': 'todo',
    'Password is too short.': 'todo',
    'Password was successfully reset.': 'todo',
    'Password was successfully updated.': 'todo',
    'Passwords do not match.': 'todo',
    'Profile successfully updated.': 'todo',
    'Successfully removed organization: {0}.': 'todo',
    'Successfully two factor authenticated.': 'todo',
    'Successfully verified account.': 'todo',
    'Too many failed login attempts, please reset your password, and try again.':
      'todo',
    'Two factor code has been successfully sent, you will receive a text message shortly.':
      'todo',
    'Unable to authenticate. Please try again.': 'todo',
    'Unable to create domain. Please try again.': 'todo',
    'Unable to create organization. Please try again.': 'todo',
    'Unable to remove domain. Please try again.': 'todo',
    'Unable to remove organization. Please try again.': 'todo',
    'Unable to reset password. Please try again.': 'todo',
    'Unable to send TFA code, please try again.': 'todo',
    'Unable to sign in, please try again.': 'todo',
    'Unable to sign up. Please try again.': 'todo',
    'Unable to two factor authenticate. Please try again.': 'todo',
    'Unable to update domain. Please try again.': 'todo',
    'Unable to update organization. Please try again.': 'todo',
    'Unable to update password, current password does not match. Please try again.':
      'todo',
    'Unable to update password, new passwords do not match. Please try again.':
      'todo',
    'Unable to update password, passwords are required to be 12 characters or longer. Please try again.':
      'todo',
    'Unable to update password. Please try again.': 'todo',
    'Unable to update profile. Please try again.': 'todo',
    'Unable to verify account. Please request a new email.': 'todo',
    'Unable to verify account. Please try again.': 'todo',
    'Username already in use.': 'todo',
    "We've sent you a text message with an authentication code to sign into Pulse.":
      'todo',
    "We've sent you an email with an authentication code to sign into Pulse.":
      'todo',
  },
}
