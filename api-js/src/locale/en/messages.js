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
    'Could not retrieve specified domain.':
      'Could not retrieve specified domain.',
    'Could not retrieve specified organization.':
      'Could not retrieve specified organization.',
    'Error, unable to have first, and last set at the same time.':
      'Error, unable to have first, and last set at the same time.',
    'If an account with this username is found, a password reset link will be found in your inbox.':
      'If an account with this username is found, a password reset link will be found in your inbox.',
    'If an account with this username is found, an email verification link will be found in your inbox.':
      'If an account with this username is found, an email verification link will be found in your inbox.',
    'New passwords do not match. Please try again.':
      'New passwords do not match. Please try again.',
    'No domain with the provided domain could be found.':
      'No domain with the provided domain could be found.',
    'No organization with the provided slug could be found.':
      'No organization with the provided slug could be found.',
    'Password is not strong enough. Please try again.':
      'Password is not strong enough. Please try again.',
    'Password is too short.': 'Password is too short.',
    'Password was successfully reset.': 'Password was successfully reset.',
    'Password was successfully updated.': 'Password was successfully updated.',
    'Passwords do not match.': 'Passwords do not match.',
    'Profile successfully updated.': 'Profile successfully updated.',
    'Successfully invited user to organization, and sent notification email.':
      'Successfully invited user to organization, and sent notification email.',
    'Successfully removed domain: {0} from {1}.': function (a) {
      return ['Successfully removed domain: ', a('0'), ' from ', a('1'), '.']
    },
    'Successfully removed organization: {0}.': function (a) {
      return ['Successfully removed organization: ', a('0'), '.']
    },
    'Successfully sent invitation to service, and organization email.':
      'Successfully sent invitation to service, and organization email.',
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
    'Unable to find dkim result. Please try again.':
      'Unable to find dkim result. Please try again.',
    'Unable to find dkim scan. Please try again.':
      'Unable to find dkim scan. Please try again.',
    'Unable to find dmarc scan. Please try again.':
      'Unable to find dmarc scan. Please try again.',
    'Unable to find domain. Please try again.':
      'Unable to find domain. Please try again.',
    'Unable to find organization. Please try again.':
      'Unable to find organization. Please try again.',
    'Unable to find spf scan. Please try again.':
      'Unable to find spf scan. Please try again.',
    'Unable to find user. Please try again.':
      'Unable to find user. Please try again.',
    'Unable to have both first, and last arguments set at the same time.':
      'Unable to have both first, and last arguments set at the same time.',
    'Unable to invite user. Please try again.':
      'Unable to invite user. Please try again.',
    'Unable to invite yourself to an org. Please try again.':
      'Unable to invite yourself to an org. Please try again.',
    'Unable to load dkim results. Please try again.':
      'Unable to load dkim results. Please try again.',
    'Unable to load dkim scans. Please try again.':
      'Unable to load dkim scans. Please try again.',
    'Unable to load dmarc scans. Please try again.':
      'Unable to load dmarc scans. Please try again.',
    'Unable to load domains. Please try again.':
      'Unable to load domains. Please try again.',
    'Unable to load organizations. Please try again.':
      'Unable to load organizations. Please try again.',
    'Unable to load spf scans. Please try again.':
      'Unable to load spf scans. Please try again.',
    'Unable to query domains. Please try again.':
      'Unable to query domains. Please try again.',
    'Unable to query organizations. Please try again.':
      'Unable to query organizations. Please try again.',
    'Unable to remove domain. Please try again.':
      'Unable to remove domain. Please try again.',
    'Unable to remove organization. Please try again.':
      'Unable to remove organization. Please try again.',
    'Unable to reset password. Please try again.':
      'Unable to reset password. Please try again.',
    'Unable to retrieve {0} for domain: {domain}.': function (a) {
      return ['Unable to retrieve ', a('0'), ' for domain: ', a('domain'), '.']
    },
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
    'Unable to update users role. Please invite user to the organization.':
      'Unable to update users role. Please invite user to the organization.',
    'Unable to update users role. Please try again.':
      'Unable to update users role. Please try again.',
    'Unable to update your own role. Please try again.':
      'Unable to update your own role. Please try again.',
    'Unable to verify account. Please request a new email.':
      'Unable to verify account. Please request a new email.',
    'Unable to verify account. Please try again.':
      'Unable to verify account. Please try again.',
    'User role was updated successfully.':
      'User role was updated successfully.',
    'Username already in use.': 'Username already in use.',
    "We've sent you a text message with an authentication code to sign into Pulse.":
      "We've sent you a text message with an authentication code to sign into Pulse.",
    "We've sent you an email with an authentication code to sign into Pulse.":
      "We've sent you an email with an authentication code to sign into Pulse.",
  },
}
