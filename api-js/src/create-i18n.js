import { setupI18n } from '@lingui/core'

import englishMessages from './locale/en/messages'
import frenchMessages from './locale/fr/messages'

export const createI18n = (language) =>
  setupI18n({
    language: language,
    locales: ['en', 'fr'],
    missing: 'Traduction manquante',
    catalogs: {
      en: englishMessages,
      fr: frenchMessages,
    },
  })
