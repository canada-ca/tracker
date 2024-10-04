import React from 'react'
import { setupI18n } from '@lingui/core'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import UserPage from '../UserPage'

import { UserVarProvider } from '../../utilities/userState'
import { QUERY_CURRENT_USER } from '../../graphql/queries'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from '../../components/ErrorFallbackMessage'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

describe('<UserPage />', () => {
  const userName = 'testuser@testemail.gc.ca'
  const displayName = 'Test User'
  const phoneNumber = '19025551234'
  const tfaSendMethod = 'PHONE'
  const phoneValidated = true
  const emailValidated = true

  const mocks = [
    {
      request: {
        query: QUERY_CURRENT_USER,
      },
      result: {
        data: {
          userPage: {
            id: 'ODk3MDg5MzI2MA==',
            userName: userName,
            displayName: displayName,
            phoneNumber: phoneNumber,
            tfaSendMethod: tfaSendMethod,
            phoneValidated: phoneValidated,
            emailValidated: emailValidated,
          },
          isUserAdmin: false,
        },
      },
    },
  ]

  const adminMFABannerMocks = [
    {
      request: {
        query: QUERY_CURRENT_USER,
      },
      result: {
        data: {
          userPage: {
            id: 'ODk3MDg5MzI2MA==',
            userName: userName,
            displayName: displayName,
            phoneNumber: phoneNumber,
            tfaSendMethod: 'NONE',
            phoneValidated: phoneValidated,
            emailValidated: emailValidated,
          },
          isUserAdmin: true,
        },
      },
    },
  ]

  it('renders without error', async () => {
    const { queryByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <UserPage />
              </I18nProvider>
            </ChakraProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => expect(queryByText(userName)).toBeInTheDocument())
  })

  it('displays MFA notification banner when admin user lacks a TFA method', async () => {
    const { queryByText } = render(
      <MockedProvider mocks={adminMFABannerMocks} addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <UserPage />
              </I18nProvider>
            </ChakraProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(queryByText(/Admin accounts must activate a multi-factor authentication option/)).toBeInTheDocument()
    })
  })

  it('can update display name', async () => {
    const { queryByText, getByRole } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <UserPage />
              </I18nProvider>
            </ChakraProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(queryByText(displayName)).toBeInTheDocument()
    })

    const editDisplayNameButton = getByRole('button', {
      name: 'Edit Display Name',
    })
    fireEvent.click(editDisplayNameButton)
    await waitFor(() => {
      expect(queryByText(/Edit Display Name/i))
    })

    const newDisplayName = getByRole('textbox', { name: /New Display Name/i })
    const confirmBtn = getByRole('button', { name: 'Confirm' })
    userEvent.type(newDisplayName, 'New Name')
    fireEvent.click(confirmBtn)
    await waitFor(() => {
      expect(queryByText(/Changed User Display Name/i))
    })
  })

  it('can update email', async () => {
    const { queryByText, getByRole } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <UserPage />
              </I18nProvider>
            </ChakraProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(queryByText(userName)).toBeInTheDocument()
    })

    const editEmailButton = getByRole('button', {
      name: 'Edit User Email',
    })
    fireEvent.click(editEmailButton)
    await waitFor(() => {
      expect(queryByText(/Edit Email/i))
    })

    const newEmail = getByRole('textbox', { name: /New Email Address/i })
    const confirmBtn = getByRole('button', { name: 'Confirm' })
    userEvent.type(newEmail, 'newuser@test.com')
    fireEvent.click(confirmBtn)
    await waitFor(() => {
      expect(queryByText(/Changed User Email/i))
    })
  })

  it('can update password', async () => {
    const { queryByText, getByRole } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <UserPage />
              </I18nProvider>
            </ChakraProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(queryByText('∗∗∗∗∗∗∗∗∗∗∗')).toBeInTheDocument()
    })

    const editDisplayNameButton = getByRole('button', {
      name: 'Edit User Password',
    })
    fireEvent.click(editDisplayNameButton)
    await waitFor(() => {
      expect(queryByText(/Change Password/i))
    })
  })

  it('can update phone number', async () => {
    const { queryByText, getByRole } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                  <UserPage />
                </ErrorBoundary>
              </I18nProvider>
            </ChakraProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(
        getByRole('button', {
          name: 'Edit User Phone Number',
        }),
      ).toBeInTheDocument()
    })

    const editPhoneNumberBtn = getByRole('button', {
      name: 'Edit User Phone Number',
    })
    fireEvent.click(editPhoneNumberBtn)
    await waitFor(() => {
      expect(queryByText(/Edit Phone Number/i))
    })
  })

  it('can update MFA method', async () => {
    const { queryByText, getByRole } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <UserPage />
              </I18nProvider>
            </ChakraProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(queryByText(/Two-Factor Authentication:/i)).toBeInTheDocument()
    })

    const userTFAMethod = getByRole('combobox', {
      name: /TFA Method Select/i,
    })
    const confirmBtn = getByRole('button', { name: 'Save TFA Method' })
    userEvent.selectOptions(userTFAMethod, 'EMAIL')
    fireEvent.click(confirmBtn)
    await waitFor(() => {
      expect(queryByText(/Changed TFA Send Method/i))
    })
  })

  it('can close account', async () => {
    const { queryByText, getByRole } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <UserPage />
              </I18nProvider>
            </ChakraProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(queryByText(displayName)).toBeInTheDocument()
    })

    const closeAccountBtn = getByRole('button', {
      name: 'Close Account',
    })
    fireEvent.click(closeAccountBtn)
    await waitFor(() => {
      expect(queryByText(/This action CANNOT be reversed/i))
    })

    const emailField = getByRole('textbox', { name: /User Email/i })
    const confirmBtn = getByRole('button', { name: 'Confirm' })
    userEvent.type(emailField, 'New Name')
    fireEvent.click(confirmBtn)
    await waitFor(() => {
      expect(queryByText(/Account Closed Successfully/i))
    })
  })
})
