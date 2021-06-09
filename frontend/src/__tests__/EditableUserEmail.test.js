import React from 'react'
import { waitFor, render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import EditableUserEmail from '../EditableUserEmail'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { fireEvent } from '@testing-library/dom'
import { UPDATE_USER_PROFILE } from '../graphql/mutations'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<EditableUserEmail />', () => {
  it('renders', async () => {
    const { getByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'testUserName@email.com',
          jwt: 'string',
          tfaSendMethod: false,
        }}
      >
        <MockedProvider addTypename={false}>
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ThemeProvider theme={theme}>
                <EditableUserEmail />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </MockedProvider>
      </UserStateProvider>,
    )
    await waitFor(() => expect(getByText(/Edit/i)).toBeInTheDocument())
  })
  describe("when the 'edit' button is clicked", () => {
    it('opens the modal', async () => {
      const { getByText } = render(
        <UserStateProvider
          initialState={{
            userName: 'testUserName@email.com',
            jwt: 'string',
            tfaSendMethod: false,
          }}
        >
          <MockedProvider addTypename={false}>
            <MemoryRouter initialEntries={['/']}>
              <I18nProvider i18n={i18n}>
                <ThemeProvider theme={theme}>
                  <EditableUserEmail />
                </ThemeProvider>
              </I18nProvider>
            </MemoryRouter>
          </MockedProvider>
        </UserStateProvider>,
      )
      const editButton = getByText(/Edit/i)
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(getByText(/New Email Address:/i)).toBeInTheDocument()
      })
    })
  })
  describe('with the modal open', () => {
    describe('and New Email Field is empty', () => {
      describe('and the form is submitted', () => {
        it('displays field error', async () => {
          const { getByText } = render(
            <UserStateProvider
              initialState={{
                userName: 'testUserName@email.com',
                jwt: 'string',
                tfaSendMethod: false,
              }}
            >
              <MockedProvider addTypename={false}>
                <MemoryRouter initialEntries={['/']}>
                  <I18nProvider i18n={i18n}>
                    <ThemeProvider theme={theme}>
                      <EditableUserEmail />
                    </ThemeProvider>
                  </I18nProvider>
                </MemoryRouter>
              </MockedProvider>
            </UserStateProvider>,
          )
          const editButton = getByText(/Edit/i)
          fireEvent.click(editButton)

          await waitFor(() => {
            getByText('Confirm')
          })

          const confirmButton = getByText('Confirm')
          fireEvent.click(confirmButton)

          await waitFor(() => {
            expect(getByText(/Email cannot be empty/i)).toBeInTheDocument()
          })
        })
      })
    })

    describe('the New Display Name field has input', () => {
      describe('and the form is submitted', () => {
        it('displays success message', async () => {
          const mocks = [
            {
              request: {
                query: UPDATE_USER_PROFILE,
                variables: { userName: 'testUser@canada.gc.ca' },
              },
              result: {
                data: {
                  updateUserProfile: {
                    result: {
                      status: 'Hello World',
                      __typename: 'UpdateUserProfileResult',
                      user: {
                        userName: 'testUser@canada.gc.ca',
                        __typename: 'PersonalUser',
                      },
                    },
                    __typename: 'UpdateUserProfilePayload',
                  },
                },
              },
            },
          ]

          const { queryByText, getByText, getByLabelText } = render(
            <UserStateProvider
              initialState={{
                userName: 'testUserName@email.com',
                jwt: 'string',
                tfaSendMethod: false,
              }}
            >
              <MockedProvider addTypename={false} mocks={mocks}>
                <MemoryRouter initialEntries={['/']}>
                  <I18nProvider i18n={i18n}>
                    <ThemeProvider theme={theme}>
                      <EditableUserEmail />
                    </ThemeProvider>
                  </I18nProvider>
                </MemoryRouter>
              </MockedProvider>
            </UserStateProvider>,
          )
          const editButton = getByText(/Edit/i)
          fireEvent.click(editButton)

          await waitFor(() => {
            expect(queryByText(/Edit Email/)).toBeInTheDocument()
          })

          const displayName = getByLabelText(/New Email Address:/)
          fireEvent.change(displayName, {
            target: { value: 'testUser@canada.gc.ca' },
          })

          const confirmButton = getByText('Confirm')
          fireEvent.click(confirmButton)

          await waitFor(() => {
            expect(
              getByText(/You have successfully updated your email./i),
            ).toBeInTheDocument()
          })
        })

        it('displays fail message', async () => {
          const mocks = [
            {
              request: {
                query: UPDATE_USER_PROFILE,
                variables: { userName: 'a@a.a' },
              },
              result: {
                data: {
                  updateUserProfile: {
                    result: {
                      code: -60,
                      description: 'Hello World',
                      __typename: 'UpdateUserProfileError',
                    },
                    __typename: 'UpdateUserProfilePayload',
                  },
                },
              },
            },
          ]

          const { queryByText, getByText, getByLabelText } = render(
            <UserStateProvider
              initialState={{
                userName: 'testUserName@email.com',
                jwt: 'string',
                tfaSendMethod: false,
              }}
            >
              <MockedProvider addTypename={false} mocks={mocks}>
                <MemoryRouter initialEntries={['/']}>
                  <I18nProvider i18n={i18n}>
                    <ThemeProvider theme={theme}>
                      <EditableUserEmail />
                    </ThemeProvider>
                  </I18nProvider>
                </MemoryRouter>
              </MockedProvider>
            </UserStateProvider>,
          )
          const editButton = getByText(/Edit/i)
          fireEvent.click(editButton)

          await waitFor(() => {
            expect(queryByText(/Edit Email/)).toBeInTheDocument()
          })

          const displayName = getByLabelText(/New Email Address:/)
          fireEvent.change(displayName, {
            target: { value: 'testUser@canada.gc.ca' },
          })

          const confirmButton = getByText('Confirm')
          fireEvent.click(confirmButton)

          await waitFor(() => {
            expect(
              getByText(
                /An error occurred while updating your email address./i,
              ),
            ).toBeInTheDocument()
          })
        })
      })
    })
  })
})
