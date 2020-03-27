import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import {
  render,
  cleanup,
  waitFor,
  fireEvent,
} from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { CreateUserPage } from '../CreateUserPage'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<CreateUserPage />', () => {
  afterEach(cleanup)

  it('an empty input for email field displays an error message', async () => {
    const { container, queryByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider>
              <CreateUserPage />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )

    const email = container.querySelector('#email')

    await waitFor(() => {
      fireEvent.blur(email)
    })

    await waitFor(() =>
      expect(queryByText(/Email cannot be empty/i)).toBeInTheDocument(),
    )
  })

  it('an empty input for password field displays an error message', async () => {
    const { container, queryByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider>
              <CreateUserPage />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )

    const password = container.querySelector('#password')

    await waitFor(() => {
      fireEvent.blur(password)
    })

    await waitFor(() =>
      expect(queryByText(/Password cannot be empty/i)).toBeInTheDocument(),
    )
  })

  it('an empty input for confirm password field displays an error message', async () => {
    const { container, queryByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider>
              <CreateUserPage />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )

    const confirmPassword = container.querySelector('#confirmPassword')

    await waitFor(() => fireEvent.blur(confirmPassword))

    await waitFor(() =>
      expect(
        queryByText(/Confirm Password cannot be empty/i),
      ).toBeInTheDocument(),
    )
  })
})
