import React from 'react'
import { waitFor, render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import EditableUserPassword from '../EditableUserPassword'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { fireEvent } from '@testing-library/dom'

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
                <EditableUserPassword />
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
                  <EditableUserPassword />
                </ThemeProvider>
              </I18nProvider>
            </MemoryRouter>
          </MockedProvider>
        </UserStateProvider>,
      )
      const editButton = getByText(/Edit/i)
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(getByText(/Current Password/i)).toBeInTheDocument()
      })
    })
  })
  describe('with the modal open', () => {
    describe('all the fields empty', () => {
      describe('and the form is submitted', () => {
        it('displays field errors', async () => {
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
                      <EditableUserPassword />
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
            expect(
              getByText(/Please enter your current password/i),
            ).toBeInTheDocument()
          })
        })
      })
    })
  })
})
