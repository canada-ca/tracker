import React from 'react'
import { ThemeProvider } from 'emotion-theming'
import { render, cleanup } from '@testing-library/react'
import theme from '../../../theme'
import { SkipLink } from '..'

describe('SkipLinks', () => {
  afterEach(cleanup)

  it('Render without crashing', () => {
    render(
      <ThemeProvider theme={theme}>
        <SkipLink to="#top">skip to top</SkipLink>
      </ThemeProvider>,
    )
  })

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
