import React from 'react'
import { waitFor, render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import EditableUserDisplayName from '../EditableUserDisplayName'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { fireEvent } from '@testing-library/dom'

describe('<EditableUserDisplayName>', () => {
  it('renders', async () => {
    const { getByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'testUserName@email.com',
          jwt: 'string',
          tfa: false,
        }}
      >
        <MockedProvider addTypename={false}>
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={setupI18n()}>
              <ThemeProvider theme={theme}>
                <EditableUserDisplayName />
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
            tfa: false,
          }}
        >
          <MockedProvider addTypename={false}>
            <MemoryRouter initialEntries={['/']}>
              <I18nProvider i18n={setupI18n()}>
                <ThemeProvider theme={theme}>
                  <EditableUserDisplayName />
                </ThemeProvider>
              </I18nProvider>
            </MemoryRouter>
          </MockedProvider>
        </UserStateProvider>,
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
            <UserStateProvider
              initialState={{
                userName: 'testUserName@email.com',
                jwt: 'string',
                tfa: false,
              }}
            >
              <MockedProvider addTypename={false}>
                <MemoryRouter initialEntries={['/']}>
                  <I18nProvider i18n={setupI18n()}>
                    <ThemeProvider theme={theme}>
                      <EditableUserDisplayName />
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
              getByText(/Display name cannot be empty/i),
            ).toBeInTheDocument()
          })
        })
      })
    })
  })
})
