/*
    Helpers for allowing matchMedia queries to work with Jest
 */

// Media query strings that Chakra uses for breakpoints under the hood
const mediaQueryStrings = {
  base: '(min-width: 0em) and (max-width: 29.99em)',
  sm: '(min-width: 30em) and (max-width: 47.99em)',
  md: '(min-width: 48em) and (max-width: 61.99em)',
  lg: '(min-width: 62em) and (max-width: 79.99em)',
  xl: '(min-width: 80em) and (max-width: 95.99em)',
  '2xl': '(min-width: 96em)',
}

const defineMatches = (queryMatch = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => {
      return {
        matches: queryMatch ? query === queryMatch : false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }
    }),
  })
}

/**
 * Define matchMedia object, required for tests which have components that use
 *   matchMedia (or if they're children use matchMedia).
 * If the test only requires that 'matchMedia' works, call matchMediaSize
 *   without the 'size' parameter.
 * @param {('base' | 'sm' | 'md' | 'lg' | '2xl')} size
 *
 */
const matchMediaSize = (size = undefined) => {
  if (size === undefined) return defineMatches(false)

  const query = mediaQueryStrings[size]

  if (!query)
    throw new Error("Incorrect 'size' breakpoint given to matchMediaSize.")

  defineMatches(mediaQueryStrings[size])
}

export { matchMediaSize }
