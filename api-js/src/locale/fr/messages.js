/* eslint-disable */ module.exports = {
  languageData: {
    plurals: function (n, ord) {
      if (ord) return n == 1 ? 'one' : 'other'
      return n >= 0 && n < 2 ? 'one' : 'other'
    },
  },
  messages: {
    'Successfully removed organization: {0}.': 'todo',
    'Unable to create domain. Please try again.': 'todo',
    'Unable to create organization. Please try again.': 'todo',
    'Unable to remove domain. Please try again.': 'todo',
    'Unable to remove organization. Please try again.': 'todo',
    'Unable to update domain. Please try again.': 'todo',
    'Unable to update organization. Please try again.': 'todo',
  },
}
