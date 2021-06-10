import React from 'react'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import EditableUserLanguage from '../EditableUserLanguage'
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

describe('<EditableUserLanguage />', () => {
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
                <EditableUserLanguage />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </MockedProvider>
      </UserStateProvider>,
    )
    await waitFor(() => expect(getByText(/Save Language/i)).toBeInTheDocument())
  })

  it('successfully changes languages', async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_USER_PROFILE,
          variables: { preferredLang: 'FRENCH' },
        },
        result: {
          data: {
            updateUserProfile: {
              result: {
                status: 'Hello World',
                __typename: 'UpdateUserProfileResult',
                user: {
                  preferredLang: 'FRENCH',
                  __typename: 'PersonalUser',
                },
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
                <EditableUserLanguage />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </MockedProvider>
      </UserStateProvider>,
    )

    const saveBtn = getByText(/Save Language/i)
    const languageSelect = getByTestId(/user-language-select/)
    fireEvent.change(languageSelect, { target: { value: 'FRENCH' } })
    fireEvent.click(saveBtn)
    await waitFor(() =>
      expect(
        getByText(/You have successfully updated your preferred language./i),
      ).toBeInTheDocument(),
    )
  })

  it('fails at changes languages', async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_USER_PROFILE,
          variables: { preferredLang: 'FRENCH' },
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
                <EditableUserLanguage />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </MockedProvider>
      </UserStateProvider>,
    )

    const saveBtn = getByText(/Save Language/i)
    const languageSelect = getByTestId(/user-language-select/)
    fireEvent.change(languageSelect, { target: { value: 'FRENCH' } })
    fireEvent.click(saveBtn)
    await waitFor(() =>
      expect(
        getByText(
          /Unable to update to your preferred language, please try again./i,
        ),
      ).toBeInTheDocument(),
    )
  })
})
