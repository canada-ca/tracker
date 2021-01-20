import { setupI18n } from '@lingui/core'

import englishMessages from './locale/en/messages'
import frenchMessages from './locale/fr/messages'

export const createI18n = (language) =>
  setupI18n({
    locale: language,
    localeData: {
      en: { plurals: {} },
      fr: { plurals: {} },
    },
    locales: ['en', 'fr'],
    messages: {
      en: englishMessages.messages,
      fr: frenchMessages.messages,
    },
  })
