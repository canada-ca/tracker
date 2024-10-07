import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { fireEvent } from '@testing-library/dom'
import { makeVar } from '@apollo/client'

import { EditableUserDisplayName } from '../EditableUserDisplayName'

import { UserVarProvider } from '../../utilities/userState'
import { UPDATE_USER_PROFILE } from '../../graphql/mutations'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<EditableUserDisplayName>', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ChakraProvider theme={theme}>
                <EditableUserDisplayName />
              </ChakraProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => expect(getByText(/Edit/i)).toBeInTheDocument())
  })
  describe("when the 'edit' button is clicked", () => {
    it('opens the modal', async () => {
      const { getByText } = render(
        <MockedProvider addTypename={false}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <MemoryRouter initialEntries={['/']}>
              <I18nProvider i18n={i18n}>
                <ChakraProvider theme={theme}>
                  <EditableUserDisplayName />
                </ChakraProvider>
              </I18nProvider>
            </MemoryRouter>
          </UserVarProvider>
        </MockedProvider>,
      )
      const editButton = getByText(/Edit/i)
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(getByText(/Current Display Name:/i)).toBeInTheDocument()
      })
    })
  })
  describe('with the modal open', () => {
    describe('the New Display Name field is empty', () => {
      describe('and the form is submitted', () => {
        it('displays field error', async () => {
          const { getByText } = render(
            <MockedProvider addTypename={false}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <MemoryRouter initialEntries={['/']}>
                  <I18nProvider i18n={i18n}>
                    <ChakraProvider theme={theme}>
                      <EditableUserDisplayName />
                    </ChakraProvider>
                  </I18nProvider>
                </MemoryRouter>
              </UserVarProvider>
            </MockedProvider>,
          )
          const editButton = getByText(/Edit/i)
          fireEvent.click(editButton)

          await waitFor(() => {
            getByText('Confirm')
          })

          const confirmButton = getByText('Confirm')
          fireEvent.click(confirmButton)

          await waitFor(() => {
            expect(getByText(/Display name cannot be empty/i)).toBeInTheDocument()
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
                variables: { displayName: 'Test User' },
              },
              result: {
                data: {
                  updateUserProfile: {
                    result: {
                      status: 'Hello World',
                      __typename: 'UpdateUserProfileResult',
                      user: {
                        id: '1234asdf',
                        userName: 'elise.ortiz@gmail.com',
                        displayName: 'Elisa Ortiz',
                        tfaSendMethod: 'PHONE',
                        emailValidated: true,
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
            <MockedProvider addTypename={false} mocks={mocks}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <MemoryRouter initialEntries={['/']}>
                  <I18nProvider i18n={i18n}>
                    <ChakraProvider theme={theme}>
                      <EditableUserDisplayName />
                    </ChakraProvider>
                  </I18nProvider>
                </MemoryRouter>
              </UserVarProvider>
            </MockedProvider>,
          )
          const editButton = getByText(/Edit/i)
          fireEvent.click(editButton)

          await waitFor(() => {
            expect(queryByText(/Edit Display Name/)).toBeInTheDocument()
          })

          const displayName = getByLabelText(/New Display Name:/)
          fireEvent.change(displayName, { target: { value: 'Test User' } })

          const confirmButton = getByText('Confirm')
          fireEvent.click(confirmButton)

          await waitFor(() => {
            expect(getByText(/You have successfully updated your display name./i)).toBeInTheDocument()
          })
        })

        it('displays failure message', async () => {
          const mocks = [
            {
              request: {
                query: UPDATE_USER_PROFILE,
                variables: { displayName: 'Test User' },
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
            <MockedProvider addTypename={false} mocks={mocks}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <MemoryRouter initialEntries={['/']}>
                  <I18nProvider i18n={i18n}>
                    <ChakraProvider theme={theme}>
                      <EditableUserDisplayName />
                    </ChakraProvider>
                  </I18nProvider>
                </MemoryRouter>
              </UserVarProvider>
            </MockedProvider>,
          )
          const editButton = getByText(/Edit/i)
          fireEvent.click(editButton)

          await waitFor(() => {
            expect(queryByText(/Edit Display Name/)).toBeInTheDocument()
          })

          const displayName = getByLabelText(/New Display Name:/)
          fireEvent.change(displayName, { target: { value: 'Test User' } })

          const confirmButton = getByText('Confirm')
          fireEvent.click(confirmButton)

          await waitFor(() => {
            expect(getByText(/Unable to update to your display name, please try again./i)).toBeInTheDocument()
          })
        })
      })
    })
  })
})
