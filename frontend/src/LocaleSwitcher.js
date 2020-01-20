/** @jsx jsx */
import { jsx, css } from '@emotion/core'
import { useLingui } from '@lingui/react'
import { activate } from './i18n.config'

const createButton = lang => (
  <button
    css={css`
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1em;
    `}
    onClick={() => {
      if (lang === 'en') {
        activate('fr')
      } else {
        activate('en')
      }
    }}
  >
    {lang === 'en' ? 'Français' : 'English'}
  </button>
)

export const LocaleSwitcher = () => {
  const { i18n } = useLingui()
  return createButton(i18n.locale)
}
