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
import { ApolloProvider } from '@apollo/client'
import { client } from '../client'

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
      <ApolloProvider client={client}>
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
        </UserStateProvider>
      </ApolloProvider>,
    )
    await waitFor(() => expect(getByText(/Edit/i)).toBeInTheDocument())
  })
  describe("when the 'edit' button is clicked", () => {
    it('opens the modal', async () => {
      const { getByText } = render(
        <ApolloProvider client={client}>
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
          </UserStateProvider>
        </ApolloProvider>,
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
            <ApolloProvider client={client}>
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
              </UserStateProvider>
            </ApolloProvider>,
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
  })
})
