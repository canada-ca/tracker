import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import EditableUserPassword from '../EditableUserPassword'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { fireEvent } from '@testing-library/dom'
import { UPDATE_USER_PASSWORD } from '../graphql/mutations'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<EditableUserPassword />', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider addTypename={false}>
        <UserStateProvider
          initialState={{
            userName: 'testUserName@email.com',
            jwt: 'string',
            tfaSendMethod: false,
          }}
        >
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ThemeProvider theme={theme}>
                <EditableUserPassword />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserStateProvider>
      </MockedProvider>,
    )
    await waitFor(() => expect(getByText(/Edit/i)).toBeInTheDocument())
  })
  describe("when the 'edit' button is clicked", () => {
    it('opens the modal', async () => {
      const { getByText, queryByText } = render(
        <MockedProvider addTypename={false}>
          <UserStateProvider
            initialState={{
              userName: 'testUserName@email.com',
              jwt: 'string',
              tfaSendMethod: false,
            }}
          >
            <MemoryRouter initialEntries={['/']}>
              <I18nProvider i18n={i18n}>
                <ThemeProvider theme={theme}>
                  <EditableUserPassword />
                </ThemeProvider>
              </I18nProvider>
            </MemoryRouter>
          </UserStateProvider>
        </MockedProvider>,
      )
      const editButton = getByText(/Edit/i)
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(queryByText(/Change Password/i)).toBeInTheDocument()
      })
    })
  })
  describe('with the modal open', () => {
    describe('all the fields empty', () => {
      describe('and the form is submitted', () => {
        it('displays field errors', async () => {
          const { getByText, queryByText } = render(
            <MockedProvider addTypename={false}>
              <UserStateProvider
                initialState={{
                  userName: 'testUserName@email.com',
                  jwt: 'string',
                  tfaSendMethod: false,
                }}
              >
                <MemoryRouter initialEntries={['/']}>
                  <I18nProvider i18n={i18n}>
                    <ThemeProvider theme={theme}>
                      <EditableUserPassword />
                    </ThemeProvider>
                  </I18nProvider>
                </MemoryRouter>
              </UserStateProvider>
            </MockedProvider>,
          )
          const editButton = getByText(/Edit/i)
          fireEvent.click(editButton)

          await waitFor(() => {
            expect(queryByText(/Change Password/i)).toBeInTheDocument()
          })

          const confirmButton = getByText('Confirm')
          fireEvent.click(confirmButton)

          await waitFor(() => {
            expect(
              getByText(/Please enter your current password/i),
            ).toBeInTheDocument()
          })
        })
      })
    })

    describe('all the fields have input', () => {
      describe('and the form is submitted', () => {
        it('displays field success', async () => {
          const mocks = [
            {
              request: {
                query: UPDATE_USER_PASSWORD,
                variables: {
                  currentPassword: 'OldBadPassword',
                  updatedPassword: 'SuperSecretPassword',
                  updatedPasswordConfirm: 'SuperSecretPassword',
                },
              },
              result: {
                data: {
                  updateUserPassword: {
                    result: {
                      status: 'Hello World',
                      __typename: 'UpdateUserPasswordResultType',
                    },
                    __typename: 'UpdateUserPasswordPayload',
                  },
                },
              },
            },
          ]

          const { getByText, queryByText, getByLabelText } = render(
            <MockedProvider addTypename={false} mocks={mocks}>
              <UserStateProvider
                initialState={{
                  userName: 'testUserName@email.com',
                  jwt: 'string',
                  tfaSendMethod: false,
                }}
              >
                <MemoryRouter initialEntries={['/']}>
                  <I18nProvider i18n={i18n}>
                    <ThemeProvider theme={theme}>
                      <EditableUserPassword />
                    </ThemeProvider>
                  </I18nProvider>
                </MemoryRouter>
              </UserStateProvider>
            </MockedProvider>,
          )
          const editButton = getByText(/Edit/i)
          fireEvent.click(editButton)

          await waitFor(() => {
            expect(queryByText(/Change Password/i)).toBeInTheDocument()
          })

          const currentPassword = getByLabelText('Current Password:')
          const password = getByLabelText('New Password:')
          const confirmPassword = getByLabelText('Confirm New Password:')

          fireEvent.change(currentPassword, {
            target: { value: 'OldBadPassword' },
          })
          fireEvent.change(password, {
            target: { value: 'SuperSecretPassword' },
          })
          fireEvent.change(confirmPassword, {
            target: { value: 'SuperSecretPassword' },
          })

          const confirmButton = getByText('Confirm')
          fireEvent.click(confirmButton)

          await waitFor(() => {
            expect(getByText(/Changed User Password/i)).toBeInTheDocument()
          })
        })

        it('displays field fail', async () => {
          const mocks = [
            {
              request: {
                query: UPDATE_USER_PASSWORD,
                variables: {
                  currentPassword: 'OldBadPassword',
                  updatedPassword: 'SuperSecretPassword',
                  updatedPasswordConfirm: 'SuperSecretPassword',
                },
              },
              result: {
                data: {
                  updateUserPassword: {
                    result: {
                      code: -42,
                      description: 'Hello World',
                      __typename: 'UpdateUserPasswordError',
                    },
                    __typename: 'UpdateUserPasswordPayload',
                  },
                },
              },
            },
          ]

          const { getByText, queryByText, getByLabelText } = render(
            <MockedProvider addTypename={false} mocks={mocks}>
              <UserStateProvider
                initialState={{
                  userName: 'testUserName@email.com',
                  jwt: 'string',
                  tfaSendMethod: false,
                }}
              >
                <MemoryRouter initialEntries={['/']}>
                  <I18nProvider i18n={i18n}>
                    <ThemeProvider theme={theme}>
                      <EditableUserPassword />
                    </ThemeProvider>
                  </I18nProvider>
                </MemoryRouter>
              </UserStateProvider>
            </MockedProvider>,
          )
          const editButton = getByText(/Edit/i)
          fireEvent.click(editButton)

          await waitFor(() => {
            expect(queryByText(/Change Password/i)).toBeInTheDocument()
          })

          const currentPassword = getByLabelText('Current Password:')
          const password = getByLabelText('New Password:')
          const confirmPassword = getByLabelText('Confirm New Password:')

          fireEvent.change(currentPassword, {
            target: { value: 'OldBadPassword' },
          })
          fireEvent.change(password, {
            target: { value: 'SuperSecretPassword' },
          })
          fireEvent.change(confirmPassword, {
            target: { value: 'SuperSecretPassword' },
          })

          const confirmButton = getByText('Confirm')
          fireEvent.click(confirmButton)

          await waitFor(() => {
            expect(
              getByText(/Unable to update your password, please try again./i),
            ).toBeInTheDocument()
          })
        })
      })
    })
  })
})
