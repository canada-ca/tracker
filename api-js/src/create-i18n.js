const { setupI18n } = require('@lingui/core')

const englishMessages = require('./locale/en/messages')
const frenchMessages = require('./locale/fr/messages')

module.exports.createI18n = (language) =>
  setupI18n({
    language: language,
    locales: ['en', 'fr'],
    missing: 'Traduction manquante',
    catalogs: {
      en: englishMessages,
      fr: frenchMessages,
    },
  })
