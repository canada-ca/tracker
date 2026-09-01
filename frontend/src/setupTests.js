import '@testing-library/jest-dom'
import { i18n } from '@lingui/core'

// This defines the window.scrollBy work-around used for firefox on android
Object.defineProperty(window, 'scrollBy', {
  value: jest.fn().mockImplementation(() => ({})),
})

window.alert = () => {}

window.matchMedia = () => ({})

global['Request'] = jest.fn().mockImplementation((_url, init = {}) => ({
  method: init.method || 'GET',
  signal: {
    removeEventListener: () => {},
    addEventListener: () => {},
  },
}))

global.TextEncoder = require('util').TextEncoder

beforeEach(() => {
  i18n.load({
    en: {},
  })
  i18n.activate('en')
})
