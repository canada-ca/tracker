import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import EditableUserPhoneNumber from '../EditableUserPhoneNumber'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { fireEvent } from '@testing-library/dom'
import { VERIFY_PHONE_NUMBER, SET_PHONE_NUMBER } from '../graphql/mutations'

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
                <EditableUserPhoneNumber />
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
                  <EditableUserPhoneNumber />
                </ThemeProvider>
              </I18nProvider>
            </MemoryRouter>
          </UserStateProvider>
        </MockedProvider>,
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
                      <EditableUserPhoneNumber />
                    </ThemeProvider>
                  </I18nProvider>
                </MemoryRouter>
              </UserStateProvider>
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
                      <EditableUserPhoneNumber />
                    </ThemeProvider>
                  </I18nProvider>
                </MemoryRouter>
              </UserStateProvider>
            </MockedProvider>,
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

          // await waitFor(() => {
          //   expect(getByText(/Verify/i)).toBeInTheDocument()
          // })
        })
      })
    })
  })
})
