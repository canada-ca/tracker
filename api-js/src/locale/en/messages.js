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
    'Authentication error. Please sign in again.':
      'Authentication error. Please sign in again.',
    'Authentication error. Please sign in.':
      'Authentication error. Please sign in.',
    'Could not retrieve specified domain.':
      'Could not retrieve specified domain.',
    'Could not retrieve specified organization.':
      'Could not retrieve specified organization.',
    'Error when retrieving dmarc report information. Please try again.':
      'Error when retrieving dmarc report information. Please try again.',
    'If an account with this username is found, a password reset link will be found in your inbox.':
      'If an account with this username is found, a password reset link will be found in your inbox.',
    'If an account with this username is found, an email verification link will be found in your inbox.':
      'If an account with this username is found, an email verification link will be found in your inbox.',
    'Invalid token, please request a new one.':
      'Invalid token, please request a new one.',
    'New passwords do not match. Please try again.':
      'New passwords do not match. Please try again.',
    'No domain with the provided domain could be found.':
      'No domain with the provided domain could be found.',
    'No organization with the provided slug could be found.':
      'No organization with the provided slug could be found.',
    'Passing both `first` and `last` to paginate the `affiliation` is not supported.':
      'Passing both `first` and `last` to paginate the `affiliation` is not supported.',
    'Passing both `first` and `last` to paginate the `dkimResults` connection is not supported.':
      'Passing both `first` and `last` to paginate the `dkimResults` connection is not supported.',
    'Passing both `first` and `last` to paginate the `dkim` connection is not supported.':
      'Passing both `first` and `last` to paginate the `dkim` connection is not supported.',
    'Passing both `first` and `last` to paginate the `dmarc` connection is not supported.':
      'Passing both `first` and `last` to paginate the `dmarc` connection is not supported.',
    'Passing both `first` and `last` to paginate the `domain` connection is not supported.':
      'Passing both `first` and `last` to paginate the `domain` connection is not supported.',
    'Passing both `first` and `last` to paginate the `https` connection is not supported.':
      'Passing both `first` and `last` to paginate the `https` connection is not supported.',
    'Passing both `first` and `last` to paginate the `organization` connection is not supported.':
      'Passing both `first` and `last` to paginate the `organization` connection is not supported.',
    'Passing both `first` and `last` to paginate the `spf` connection is not supported.':
      'Passing both `first` and `last` to paginate the `spf` connection is not supported.',
    'Passing both `first` and `last` to paginate the `ssl` connection is not supported.':
      'Passing both `first` and `last` to paginate the `ssl` connection is not supported.',
    'Password is not strong enough. Please try again.':
      'Password is not strong enough. Please try again.',
    'Password is too short.': 'Password is too short.',
    'Password was successfully reset.': 'Password was successfully reset.',
    'Password was successfully updated.': 'Password was successfully updated.',
    'Passwords do not match.': 'Passwords do not match.',
    'Profile successfully updated.': 'Profile successfully updated.',
    'Requesting `{amount}` records on the `affiliations` exceeds the `{argSet}` limit of 100 records.': function (
      a,
    ) {
      return [
        'Requesting `',
        a('amount'),
        '` records on the `affiliations` exceeds the `',
        a('argSet'),
        '` limit of 100 records.',
      ]
    },
    'Requesting `{amount}` records on the `domain` connection exceeds the `{argSet}` limit of 100 records.': function (
      a,
    ) {
      return [
        'Requesting `',
        a('amount'),
        '` records on the `domain` connection exceeds the `',
        a('argSet'),
        '` limit of 100 records.',
      ]
    },
    'Requesting `{amount}` records on the `organization` connection exceeds the `{argSet}` limit of 100 records.': function (
      a,
    ) {
      return [
        'Requesting `',
        a('amount'),
        '` records on the `organization` connection exceeds the `',
        a('argSet'),
        '` limit of 100 records.',
      ]
    },
    'Requesting {amount} records on the `dkimResults` connection exceeds the `{argSet}` limit of 100 records.': function (
      a,
    ) {
      return [
        'Requesting ',
        a('amount'),
        ' records on the `dkimResults` connection exceeds the `',
        a('argSet'),
        '` limit of 100 records.',
      ]
    },
    'Requesting {amount} records on the `dkim` connection exceeds the `{argSet}` limit of 100 records.': function (
      a,
    ) {
      return [
        'Requesting ',
        a('amount'),
        ' records on the `dkim` connection exceeds the `',
        a('argSet'),
        '` limit of 100 records.',
      ]
    },
    'Requesting {amount} records on the `dmarc` connection exceeds the `{argSet}` limit of 100 records.': function (
      a,
    ) {
      return [
        'Requesting ',
        a('amount'),
        ' records on the `dmarc` connection exceeds the `',
        a('argSet'),
        '` limit of 100 records.',
      ]
    },
    'Requesting {amount} records on the `https` connection exceeds the `{argSet}` limit of 100 records.': function (
      a,
    ) {
      return [
        'Requesting ',
        a('amount'),
        ' records on the `https` connection exceeds the `',
        a('argSet'),
        '` limit of 100 records.',
      ]
    },
    'Requesting {amount} records on the `spf` connection exceeds the `{argSet}` limit of 100 records.': function (
      a,
    ) {
      return [
        'Requesting ',
        a('amount'),
        ' records on the `spf` connection exceeds the `',
        a('argSet'),
        '` limit of 100 records.',
      ]
    },
    'Requesting {amount} records on the `ssl` connection exceeds the `{argSet}` limit of 100 records.': function (
      a,
    ) {
      return [
        'Requesting ',
        a('amount'),
        ' records on the `ssl` connection exceeds the `',
        a('argSet'),
        '` limit of 100 records.',
      ]
    },
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
    'Unable to check permission. Please try again.':
      'Unable to check permission. Please try again.',
    'Unable to create domain. Please try again.':
      'Unable to create domain. Please try again.',
    'Unable to create organization. Please try again.':
      'Unable to create organization. Please try again.',
    'Unable to find dkim guidance tags. Please try again.':
      'Unable to find dkim guidance tags. Please try again.',
    'Unable to find dkim result. Please try again.':
      'Unable to find dkim result. Please try again.',
    'Unable to find dkim scan. Please try again.':
      'Unable to find dkim scan. Please try again.',
    'Unable to find dmarc guidance tags. Please try again.':
      'Unable to find dmarc guidance tags. Please try again.',
    'Unable to find dmarc scan. Please try again.':
      'Unable to find dmarc scan. Please try again.',
    'Unable to find domain. Please try again.':
      'Unable to find domain. Please try again.',
    'Unable to find https guidance tags. Please try again.':
      'Unable to find https guidance tags. Please try again.',
    'Unable to find https scan. Please try again.':
      'Unable to find https scan. Please try again.',
    'Unable to find organization. Please try again.':
      'Unable to find organization. Please try again.',
    'Unable to find spf guidance tags. Please try again.':
      'Unable to find spf guidance tags. Please try again.',
    'Unable to find spf scan. Please try again.':
      'Unable to find spf scan. Please try again.',
    'Unable to find ssl guidance tags. Please try again.':
      'Unable to find ssl guidance tags. Please try again.',
    'Unable to find ssl scan. Please try again.':
      'Unable to find ssl scan. Please try again.',
    'Unable to find user affiliation(s). Please try again.':
      'Unable to find user affiliation(s). Please try again.',
    'Unable to find user. Please try again.':
      'Unable to find user. Please try again.',
    'Unable to invite user. Please try again.':
      'Unable to invite user. Please try again.',
    'Unable to invite yourself to an org. Please try again.':
      'Unable to invite yourself to an org. Please try again.',
    'Unable to load affiliations. Please try again.':
      'Unable to load affiliations. Please try again.',
    'Unable to load dkim results. Please try again.':
      'Unable to load dkim results. Please try again.',
    'Unable to load dkim scans. Please try again.':
      'Unable to load dkim scans. Please try again.',
    'Unable to load dmarc scans. Please try again.':
      'Unable to load dmarc scans. Please try again.',
    'Unable to load domains. Please try again.':
      'Unable to load domains. Please try again.',
    'Unable to load https scans. Please try again.':
      'Unable to load https scans. Please try again.',
    'Unable to load organizations. Please try again.':
      'Unable to load organizations. Please try again.',
    'Unable to load spf scans. Please try again.':
      'Unable to load spf scans. Please try again.',
    'Unable to load ssl scans. Please try again.':
      'Unable to load ssl scans. Please try again.',
    'Unable to query affiliations. Please try again.':
      'Unable to query affiliations. Please try again.',
    'Unable to query domains. Please try again.':
      'Unable to query domains. Please try again.',
    'Unable to query organizations. Please try again.':
      'Unable to query organizations. Please try again.',
    'Unable to query user without a username, please try again.':
      'Unable to query user without a username, please try again.',
    'Unable to query user, please try again.':
      'Unable to query user, please try again.',
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
    'Unable to send org invite email. Please try again.':
      'Unable to send org invite email. Please try again.',
    'Unable to send password reset email. Please try again.':
      'Unable to send password reset email. Please try again.',
    'Unable to send two factor authentication message. Please try again.':
      'Unable to send two factor authentication message. Please try again.',
    'Unable to send verification email. Please try again.':
      'Unable to send verification email. Please try again.',
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
    'Unable to verify if user is an admin, please try again.':
      'Unable to verify if user is an admin, please try again.',
    'User could not be queried.': 'User could not be queried.',
    'User role was updated successfully.':
      'User role was updated successfully.',
    'Username already in use.': 'Username already in use.',
    "We've sent you a text message with an authentication code to sign into Pulse.":
      "We've sent you a text message with an authentication code to sign into Pulse.",
    "We've sent you an email with an authentication code to sign into Pulse.":
      "We've sent you an email with an authentication code to sign into Pulse.",
    'You must provide a `first` or `last` value to properly paginate the `affiliation`.':
      'You must provide a `first` or `last` value to properly paginate the `affiliation`.',
    'You must provide a `first` or `last` value to properly paginate the `dkimResults` connection.':
      'You must provide a `first` or `last` value to properly paginate the `dkimResults` connection.',
    'You must provide a `first` or `last` value to properly paginate the `dkim` connection.':
      'You must provide a `first` or `last` value to properly paginate the `dkim` connection.',
    'You must provide a `first` or `last` value to properly paginate the `dmarc` connection.':
      'You must provide a `first` or `last` value to properly paginate the `dmarc` connection.',
    'You must provide a `first` or `last` value to properly paginate the `domain` connection.':
      'You must provide a `first` or `last` value to properly paginate the `domain` connection.',
    'You must provide a `first` or `last` value to properly paginate the `https` connection.':
      'You must provide a `first` or `last` value to properly paginate the `https` connection.',
    'You must provide a `first` or `last` value to properly paginate the `organization` connection.':
      'You must provide a `first` or `last` value to properly paginate the `organization` connection.',
    'You must provide a `first` or `last` value to properly paginate the `spf` connection.':
      'You must provide a `first` or `last` value to properly paginate the `spf` connection.',
    'You must provide a `first` or `last` value to properly paginate the `ssl` connection.':
      'You must provide a `first` or `last` value to properly paginate the `ssl` connection.',
    '`{argSet}` must be of type `number` not `{typeSet}`.': function (a) {
      return [
        '`',
        a('argSet'),
        '` must be of type `number` not `',
        a('typeSet'),
        '`.',
      ]
    },
    '`{argSet}` on the `affiliations` cannot be less than zero.': function (a) {
      return [
        '`',
        a('argSet'),
        '` on the `affiliations` cannot be less than zero.',
      ]
    },
    '`{argSet}` on the `dkimResults` connection cannot be less than zero.': function (
      a,
    ) {
      return [
        '`',
        a('argSet'),
        '` on the `dkimResults` connection cannot be less than zero.',
      ]
    },
    '`{argSet}` on the `dkim` connection cannot be less than zero.': function (
      a,
    ) {
      return [
        '`',
        a('argSet'),
        '` on the `dkim` connection cannot be less than zero.',
      ]
    },
    '`{argSet}` on the `dmarc` connection cannot be less than zero.': function (
      a,
    ) {
      return [
        '`',
        a('argSet'),
        '` on the `dmarc` connection cannot be less than zero.',
      ]
    },
    '`{argSet}` on the `domain` connection cannot be less than zero.': function (
      a,
    ) {
      return [
        '`',
        a('argSet'),
        '` on the `domain` connection cannot be less than zero.',
      ]
    },
    '`{argSet}` on the `https` connection cannot be less than zero.': function (
      a,
    ) {
      return [
        '`',
        a('argSet'),
        '` on the `https` connection cannot be less than zero.',
      ]
    },
    '`{argSet}` on the `organization` connection cannot be less than zero.': function (
      a,
    ) {
      return [
        '`',
        a('argSet'),
        '` on the `organization` connection cannot be less than zero.',
      ]
    },
    '`{argSet}` on the `spf` connection cannot be less than zero.': function (
      a,
    ) {
      return [
        '`',
        a('argSet'),
        '` on the `spf` connection cannot be less than zero.',
      ]
    },
    '`{argSet}` on the `ssl` connection cannot be less than zero.': function (
      a,
    ) {
      return [
        '`',
        a('argSet'),
        '` on the `ssl` connection cannot be less than zero.',
      ]
    },
  },
}
