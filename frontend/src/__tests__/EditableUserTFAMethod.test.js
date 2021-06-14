import React from 'react'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import EditableUserTFAMethod from '../EditableUserTFAMethod'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
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

describe('<EditableUserTFAMethod />', () => {
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
                <EditableUserTFAMethod />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserStateProvider>
      </MockedProvider>,
    )
    await waitFor(() => expect(getByText(/Save/i)).toBeInTheDocument())
  })

  it('successfully changes TFA send method', async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_USER_PROFILE,
          variables: { tfaSendMethod: 'EMAIL' },
        },
        result: {
          data: {
            updateUserProfile: {
              result: {
                status: 'Hello World',
                user: {
                  tfaSendMethod: 'EMAIL',
                  __typename: 'PersonalUser',
                },
                __typename: 'UpdateUserProfileResult',
              },
              __typename: 'UpdateUserProfilePayload',
            },
          },
        },
      },
    ]

    const { getByText, getByTestId } = render(
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
                <EditableUserTFAMethod
                  currentTFAMethod="NONE"
                  emailValidated={true}
                  phoneValidated={true}
                />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </MockedProvider>
      </UserStateProvider>,
    )

    const saveBtn = getByText(/Save/i)
    const languageSelect = getByTestId(/tfa-method-select/)
    fireEvent.change(languageSelect, { target: { value: 'EMAIL' } })
    fireEvent.click(saveBtn)
    await waitFor(() =>
      expect(
        getByText(/You have successfully updated your TFA send method./i),
      ).toBeInTheDocument(),
    )
  })

  it('fails at changing TFA send method', async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_USER_PROFILE,
          variables: { tfaSendMethod: 'EMAIL' },
        },
        result: {
          data: {
            updateUserProfile: {
              result: {
                code: -86,
                description: 'Hello World',
                __typename: 'UpdateUserProfileError',
              },
              __typename: 'UpdateUserProfilePayload',
            },
          },
        },
      },
    ]

    const { getByText, getByTestId } = render(
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
                <EditableUserTFAMethod
                  currentTFAMethod="NONE"
                  emailValidated={true}
                  phoneValidated={true}
                />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </MockedProvider>
      </UserStateProvider>,
    )

    const saveBtn = getByText(/Save/i)
    const languageSelect = getByTestId(/tfa-method-select/)
    fireEvent.change(languageSelect, { target: { value: 'EMAIL' } })
    fireEvent.click(saveBtn)
    await waitFor(() =>
      expect(
        getByText(
          /Unable to update to your TFA send method, please try again./i,
        ),
      ).toBeInTheDocument(),
    )
  })
})
