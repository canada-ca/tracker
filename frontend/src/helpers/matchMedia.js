// define matchMedia object, required for tests which have components that use
// matchMedia (or if they're children use matchMedia)
// If the test only requires that 'matchMedia' works (not implemented by default),
// we can simply include the following for the test file: import '../helpers/matchMedia'
export default Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// We can use the following strings to force media query matches in our tests.
// For example, to match 'md':
// Object.defineProperty(window, 'matchMedia', {
//   writable: true,
//   value: jest.fn().mockImplementation((query) => {
//     return {
//       matches: query === '(min-width: 48em) and (max-width: 61.99em)',
//       media: query,
//       onchange: null,
//       addListener: jest.fn(), // Deprecated
//       removeListener: jest.fn(), // Deprecated
//       addEventListener: jest.fn(),
//       removeEventListener: jest.fn(),
//       dispatchEvent: jest.fn(),
//     }
//   }),
// })
const _mediaQueryStrings = {
  base: '(min-width: 0em) and (max-width: 29.99em)',
  sm: '(min-width: 30em) and (max-width: 47.99em)',
  md: '(min-width: 48em) and (max-width: 61.99em)',
  lg: '(min-width: 62em) and (max-width: 79.99em)',
  xl: '(min-width: 80em) and (max-width: 95.99em)',
  '2xl': '(min-width: 96em)',
}
