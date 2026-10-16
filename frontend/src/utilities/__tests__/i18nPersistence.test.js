import { i18n } from '@lingui/core'

import { activate, getStoredLocale } from '../i18n.config'

describe('locale persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns null when nothing was stored', () => {
    expect(getStoredLocale()).toBeNull()
  })

  it('returns the stored locale', () => {
    window.localStorage.setItem('locale', 'fr')
    expect(getStoredLocale()).toEqual('fr')
  })

  it('ignores an invalid stored value', () => {
    window.localStorage.setItem('locale', 'de')
    expect(getStoredLocale()).toBeNull()
  })

  it('persists the activated locale for the next tab', async () => {
    await activate('fr')
    expect(i18n.locale).toEqual('fr')
    expect(window.localStorage.getItem('locale')).toEqual('fr')

    await activate('en')
    expect(window.localStorage.getItem('locale')).toEqual('en')
  })
})
