import { i18n } from '@lingui/core'
import { fr, en } from 'make-plural/plurals'
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
      /* webpackChunkName: "i18n-[index]" */ `@lingui/loader!./locales/${locale}.po`
    )
  } catch (e) {
    // this fails only during tests due to webpack errors.
    catalog = {messages: {}}
  }

  i18n.load(locale, catalog.messages)
  i18n.activate(locale)
}

activate('en')
