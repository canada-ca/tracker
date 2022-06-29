/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'

// This defines the window.scrollBy work-around used for firefox on android
Object.defineProperty(window, 'scrollBy', {
  value: jest.fn().mockImplementation(() => ({})),
})

window.alert = () => {}

window.matchMedia = () => ({})
