import { i18n } from '@lingui/core'
import { en, fr } from 'make-plural/plurals'

i18n.loadLocaleData('en', { plurals: en })
i18n.loadLocaleData('fr', { plurals: fr })

export const locales = {
  en: 'English',
  fr: 'Français',
}

export async function activate(locale) {
  let catalog
  try {
    catalog = await import(
      /* webpackChunkName: "i18n-[index]" */ `@lingui/loader!../locales/${locale}.po`
    )
  } catch (e) {
    // this fails only during tests due to webpack errors.
    catalog = { messages: {} }
  }

  i18n.load(locale, catalog.messages)
  i18n.activate(locale)
}

let defaultLanguage
const acceptedLanguageCodeRegex = /^(fr|en).*/i

if (navigator.languages) {
  // check navigator.languages for supported languages
  navigator.languages.find((lang) => {
    const found = lang.match(acceptedLanguageCodeRegex)

    if (found) defaultLanguage = found[1].toLowerCase()

    return found
  })
} else if (navigator.language) {
  // IE doesn't support navigator.languages, check navigator.language
  const found = navigator.language.match(acceptedLanguageCodeRegex)
  if (found) defaultLanguage = found[1].toLowerCase()
} else {
  // default to 'en'
  defaultLanguage = 'en'
}

export const defaultLocale = defaultLanguage
