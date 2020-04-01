import React from 'react'
import { render, cleanup } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { SkipLink } from '../SkipLink'

describe('SkipLinks', () => {
  afterEach(cleanup)

  it('are visible by default', () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <SkipLink to="#top">skip to top</SkipLink>
      </ThemeProvider>,
    )
    const test = getByText(/skip to top/)
    expect(test).not.toHaveStyle('z-index: -999;')
  })

  it('are invisible if invisible prop set', () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <SkipLink invisible to="#top">
          skip to top
        </SkipLink>
      </ThemeProvider>,
    )
    const test = getByText(/skip to top/)
    expect(test).toHaveStyle('z-index: -999;')
  })
})
