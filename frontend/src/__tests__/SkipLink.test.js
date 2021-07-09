import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { SkipLink } from '../SkipLink'

describe('SkipLinks', () => {
  afterEach(cleanup)

  it('are visible by default', () => {
    const { getByText } = render(
      <ChakraProvider theme={theme}>
        <SkipLink to="#top">skip to top</SkipLink>
      </ChakraProvider>,
    )
    const test = getByText(/skip to top/)
    expect(test).not.toHaveStyle('z-index: -999;')
  })

  it('are invisible if invisible prop set', () => {
    const { getByText } = render(
      <ChakraProvider theme={theme}>
        <SkipLink invisible to="#top">
          skip to top
        </SkipLink>
      </ChakraProvider>,
    )
    const test = getByText(/skip to top/)
    expect(test).toHaveStyle('z-index: -999;')
  })
})
