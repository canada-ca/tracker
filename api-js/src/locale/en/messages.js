/* eslint-disable */ module.exports = {
  languageData: {
    plurals: function (n, ord) {
      var s = String(n).split('.'),
        v0 = !s[1],
        t0 = Number(s[0]) == n,
        n10 = t0 && s[0].slice(-1),
        n100 = t0 && s[0].slice(-2)
      if (ord)
        return n10 == 1 && n100 != 11
          ? 'one'
          : n10 == 2 && n100 != 12
          ? 'two'
          : n10 == 3 && n100 != 13
          ? 'few'
          : 'other'
      return n == 1 && v0 ? 'one' : 'other'
    },
  },
  messages: {
    'Authentication error, please sign in again.':
      'Authentication error, please sign in again.',
    'If an account with this username is found, a password reset link will be found in your inbox.':
      'If an account with this username is found, a password reset link will be found in your inbox.',
    'If an account with this username is found, an email verification link will be found in your inbox.':
      'If an account with this username is found, an email verification link will be found in your inbox.',
    'New passwords do not match. Please try again.':
      'New passwords do not match. Please try again.',
    'Password is not strong enough. Please try again.':
      'Password is not strong enough. Please try again.',
    'Password is too short.': 'Password is too short.',
    'Password was successfully reset.': 'Password was successfully reset.',
    'Password was successfully updated.': 'Password was successfully updated.',
    'Passwords do not match.': 'Passwords do not match.',
    'Profile successfully updated.': 'Profile successfully updated.',
    'Successfully removed organization: {0}.': function (a) {
      return ['Successfully removed organization: ', a('0'), '.']
    },
    'Successfully two factor authenticated.':
      'Successfully two factor authenticated.',
    'Successfully verified account.': 'Successfully verified account.',
    'Too many failed login attempts, please reset your password, and try again.':
      'Too many failed login attempts, please reset your password, and try again.',
    'Two factor code has been successfully sent, you will receive a text message shortly.':
      'Two factor code has been successfully sent, you will receive a text message shortly.',
    'Unable to authenticate. Please try again.':
      'Unable to authenticate. Please try again.',
    'Unable to create domain. Please try again.':
      'Unable to create domain. Please try again.',
    'Unable to create organization. Please try again.':
      'Unable to create organization. Please try again.',
    'Unable to remove domain. Please try again.':
      'Unable to remove domain. Please try again.',
    'Unable to remove organization. Please try again.':
      'Unable to remove organization. Please try again.',
    'Unable to reset password. Please try again.':
      'Unable to reset password. Please try again.',
    'Unable to send TFA code, please try again.':
      'Unable to send TFA code, please try again.',
    'Unable to sign in, please try again.':
      'Unable to sign in, please try again.',
    'Unable to sign up. Please try again.':
      'Unable to sign up. Please try again.',
    'Unable to two factor authenticate. Please try again.':
      'Unable to two factor authenticate. Please try again.',
    'Unable to update domain. Please try again.':
      'Unable to update domain. Please try again.',
    'Unable to update organization. Please try again.':
      'Unable to update organization. Please try again.',
    'Unable to update password, current password does not match. Please try again.':
      'Unable to update password, current password does not match. Please try again.',
    'Unable to update password, new passwords do not match. Please try again.':
      'Unable to update password, new passwords do not match. Please try again.',
    'Unable to update password, passwords are required to be 12 characters or longer. Please try again.':
      'Unable to update password, passwords are required to be 12 characters or longer. Please try again.',
    'Unable to update password. Please try again.':
      'Unable to update password. Please try again.',
    'Unable to update profile. Please try again.':
      'Unable to update profile. Please try again.',
    'Unable to verify account. Please request a new email.':
      'Unable to verify account. Please request a new email.',
    'Unable to verify account. Please try again.':
      'Unable to verify account. Please try again.',
    'Username already in use.': 'Username already in use.',
    "We've sent you a text message with an authentication code to sign into Pulse.":
      "We've sent you a text message with an authentication code to sign into Pulse.",
    "We've sent you an email with an authentication code to sign into Pulse.":
      "We've sent you an email with an authentication code to sign into Pulse.",
  },
}
