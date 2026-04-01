import React from 'react'
import { I18nProvider } from '@lingui/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { render } from '@testing-library/react'
import { i18n } from '@lingui/core'
import { Footer } from '../Footer'

describe('<Footer />', () => {
  beforeEach(() => (global.scrollTo = jest.fn()))

  it('renders children correctly', () => {
    const { getAllByText } = render(
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <Footer>
            <div>foo</div>
          </Footer>
        </I18nProvider>
      </ChakraProvider>,
    )

    const test = getAllByText(/foo/)
    expect(test).toHaveLength(1)
  })
})
