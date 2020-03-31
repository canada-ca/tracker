import React from 'react'
import { PaginationButtons } from '../PaginationButtons'
import { i18n } from '@lingui/core'
import { render, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/react-testing'

describe('<PaginationButtons />', () => {
  afterEach(cleanup)

  it('the component renders', async () => {
    const { container } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <PaginationButtons next={true} previous={true} />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )
    expect(container).toBeTruthy()
  })
})
