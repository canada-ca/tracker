import { setupI18n } from '@lingui/core'
import englishMessages from './locale/en/messages'
import frenchMessages from './locale/fr/messages'

export const createI18n = (language = 'en') => {
  const i18n = setupI18n({
    messages: {
      en: englishMessages.messages,
      fr: frenchMessages.messages,
    },
  })

  i18n.load({ en: englishMessages.messages, fr: frenchMessages.messages })
  i18n.activate(language)
  return i18n
}
