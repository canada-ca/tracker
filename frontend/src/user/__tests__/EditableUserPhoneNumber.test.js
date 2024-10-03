import React, { Suspense } from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { fireEvent } from '@testing-library/dom'
import { makeVar } from '@apollo/client'
import userEvent from '@testing-library/user-event'

import { EditableUserPhoneNumber } from '../EditableUserPhoneNumber'

import { UserVarProvider } from '../../utilities/userState'
import { VERIFY_PHONE_NUMBER, SET_PHONE_NUMBER } from '../../graphql/mutations'

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
            expect(getByText(/Phone number field must not be empty/i)).toBeInTheDocument()
          })
        })
      })
    })

    describe('new phone number is submitted', () => {
      describe('verification is submitted', () => {
        it('displays success messages', async () => {
          const mocks = [
            {
              request: {
                query: SET_PHONE_NUMBER,
                variables: { phoneNumber: '+19025555555' },
              },
              result: {
                data: {
                  setPhoneNumber: {
                    result: {
                      status:
                        'Phone number has been successfully set, you will receive a verification text message shortly.',
                      user: {
                        id: '1234asdf',
                        userName: 'testUser@canada.gc.ca',
                        displayName: 'test user',
                        tfaSendMethod: 'PHONE',
                        emailValidated: true,
                        phoneValidated: true,
                        phoneNumber: '+17895551234',
                        __typename: 'PersonalUser',
                      },
                      __typename: 'SetPhoneNumberResult',
                    },
                    __typename: 'SetPhoneNumberPayload',
                  },
                },
              },
            },
            {
              request: {
                query: VERIFY_PHONE_NUMBER,
                variables: { twoFactorCode: 123456 },
              },
              result: {
                data: {
                  verifyPhoneNumber: {
                    result: {
                      status: 'You have successfully verified your phone number.',
                      user: {
                        id: '1234asdf',
                        phoneNumber: '+19025555555',
                        phoneValidated: true,
                        __typename: 'PersonalUser',
                      },
                      __typename: 'VerifyPhoneNumberResult',
                    },
                    __typename: 'VerifyPhoneNumberPayload',
                  },
                },
              },
            },
          ]
          const { queryByText, getByText, getByRole, getAllByRole } = render(
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
          // ensure suspense is not active
          await waitFor(() => {
            expect(queryByText(/test loading/)).not.toBeInTheDocument()
          })

          const editButton = getByText(/Edit/i)
          fireEvent.click(editButton)

          // ensure editing phone number modal is open
          await waitFor(() => {
            expect(queryByText(/Edit Phone Number/)).toBeInTheDocument()
          })

          const displayNameInput = getByRole('textbox', {
            name: /New Phone Number:/,
          })

          userEvent.clear(displayNameInput)
          userEvent.type(displayNameInput, '19025555555')

          const confirmButton = getByRole('button', { name: 'Confirm' })
          fireEvent.click(confirmButton)

          await waitFor(() => {
            expect(queryByText(/Please enter your two factor code below/i)).toBeInTheDocument()
          })

          const twoFactorCode = getAllByRole('textbox', { name: 'Please enter your pin code' })[0]
          const form = getByRole('form')

          fireEvent.change(twoFactorCode, {
            target: {
              value: '123456',
            },
          })

          fireEvent.submit(form)

          await waitFor(() =>
            expect(queryByText(/You have successfully updated your phone number\./)).toBeInTheDocument(),
          )
        })
      })
    })
  })
})
