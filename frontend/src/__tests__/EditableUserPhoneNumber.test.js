import React, { Suspense } from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import EditableUserPhoneNumber from '../EditableUserPhoneNumber'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserVarProvider } from '../UserState'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { fireEvent } from '@testing-library/dom'
import { VERIFY_PHONE_NUMBER, SET_PHONE_NUMBER } from '../graphql/mutations'
import { makeVar } from '@apollo/client'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<EditableUserPhoneNumber />', () => {
  it('renders', async () => {
    const { getByText } = render(
      <Suspense fallback="test loading">
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
                  <EditableUserPhoneNumber />
                </ChakraProvider>
              </I18nProvider>
            </MemoryRouter>
          </UserVarProvider>
        </MockedProvider>
      </Suspense>,
    )
    await waitFor(() => expect(getByText(/Edit/i)).toBeInTheDocument())
  })
  describe("when the 'edit' button is clicked", () => {
    it('opens the modal', async () => {
      const { getByText } = render(
        <Suspense fallback="test loading">
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
                    <EditableUserPhoneNumber />
                  </ChakraProvider>
                </I18nProvider>
              </MemoryRouter>
            </UserVarProvider>
          </MockedProvider>
        </Suspense>,
      )
      const editButton = getByText(/Edit/i)
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(getByText(/New Phone Number:/i)).toBeInTheDocument()
      })
    })
  })
  describe('with the modal open', () => {
    describe('and New Phone Number is empty', () => {
      describe('and the form is submitted', () => {
        it('displays field error', async () => {
          const { getByText } = render(
            <Suspense fallback="test loading">
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
                        <EditableUserPhoneNumber />
                      </ChakraProvider>
                    </I18nProvider>
                  </MemoryRouter>
                </UserVarProvider>
              </MockedProvider>
            </Suspense>,
          )
          const editButton = getByText(/Edit/i)
          fireEvent.click(editButton)

          await waitFor(() => {
            getByText('Confirm')
          })

          const confirmButton = getByText('Confirm')
          fireEvent.click(confirmButton)

          await waitFor(() => {
            expect(
              getByText(/Phone number field must not be empty/i),
            ).toBeInTheDocument()
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
                query: SET_PHONE_NUMBER,
                variables: { phoneNumber: '+17895551234' },
              },
              result: {
                data: {
                  updateUserProfile: {
                    result: {
                      status: 'Hello World',
                      __typename: 'UpdateUserProfileResult',
                      user: {
                        phoneNumber: '+17895551234',
                        __typename: 'PersonalUser',
                      },
                    },
                    __typename: 'UpdateUserProfilePayload',
                  },
                },
              },
            },
            {
              request: {
                query: VERIFY_PHONE_NUMBER,
                variables: { phoneNumber: '+17895551234' },
              },
              result: {
                data: {
                  updateUserProfile: {
                    result: {
                      status: 'Hello World',
                      __typename: 'UpdateUserProfileResult',
                      user: {
                        phoneNumber: '+17895551234',
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
            <Suspense fallback="test loading">
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
                        <EditableUserPhoneNumber />
                      </ChakraProvider>
                    </I18nProvider>
                  </MemoryRouter>
                </UserVarProvider>
              </MockedProvider>
            </Suspense>,
          )
          const editButton = getByText(/Edit/i)
          fireEvent.click(editButton)

          await waitFor(() => {
            expect(queryByText(/Edit Phone Number/)).toBeInTheDocument()
          })

          const displayName = getByLabelText(/New Phone Number:/)
          fireEvent.change(displayName, {
            target: { value: '+17895551234' },
          })

          const confirmButton = getByText('Confirm')
          fireEvent.click(confirmButton)
        })
      })
    })
  })
})
