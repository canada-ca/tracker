import { i18n } from '@lingui/core'

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
  }

  i18n.load(locale, catalog)
  i18n.activate(locale)
}

activate('en')
