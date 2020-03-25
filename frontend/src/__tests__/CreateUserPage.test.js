import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import {
  render,
  cleanup,
  wait,
  waitForElement,
  fireEvent,
  getByText,
  getByRole,
} from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { CreateUserPage } from '../CreateUserPage'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<CreateUserPage />', () => {
  afterEach(cleanup)

  it('successfully renders the component', () => {
    render(
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
    expect(render).toBeTruthy()
  })

  test('an empty input for email field displays an error message', async () => {
    const { container } = render(
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

    expect(render).toBeTruthy()

    const email = container.querySelector('#email')

    await wait(() => {
      fireEvent.blur(email)
    })

    const errorElement = await waitForElement(
      () => getByText(container, /Email can not be empty/i),
      { container },
    )

    expect(errorElement.innerHTML).toMatch(/Email can not be empty/i)
  })

  test('an empty input for password field displays an error message', async () => {
    const { container } = render(
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

    expect(render).toBeTruthy()

    const password = container.querySelector('#password')

    await wait(() => {
      fireEvent.blur(password)
    })

    const errorElement = await waitForElement(
      () => getByText(container, /Password can not be empty/i),
      { container },
    )

    expect(errorElement.innerHTML).toMatch(/Password can not be empty/i)
  })

  test('an empty input for confirm password field displays an error message', async () => {
    const { container } = render(
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

    expect(render).toBeTruthy()

    const confirmPassword = container.querySelector('#confirmPassword')

    await wait(() => {
      fireEvent.blur(confirmPassword)
    })

    const errorElement = await waitForElement(
      () => getByText(container, /Confirm Password can not be empty/i),
      { container },
    )

    expect(errorElement.innerHTML).toMatch(/Confirm Password can not be empty/i)
  })

  test('an empty input for password field displays an error icon', async () => {
    const { container } = render(
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

    expect(render).toBeTruthy()

    const icon = getByRole(container, "passwordIcon")
    expect(icon).toBeTruthy()
   console.log(icon)
  })
})
