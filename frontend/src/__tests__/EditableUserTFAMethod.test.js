import React from 'react'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import EditableUserTFAMethod from '../EditableUserTFAMethod'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserVarProvider } from '../UserState'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { UPDATE_USER_PROFILE } from '../graphql/mutations'
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

describe('<EditableUserTFAMethod />', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider addTypename={false}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ThemeProvider theme={theme}>
                <EditableUserTFAMethod
                  tfa={{
                    emailValidated: true,
                    phoneValidated: true,
                  }}
                />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserVarProvider>
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
      <MockedProvider addTypename={false} mocks={mocks}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ThemeProvider theme={theme}>
                <EditableUserTFAMethod
                  currentTFAMethod="NONE"
                  tfa={{
                    emailValidated: true,
                    phoneValidated: true,
                  }}
                />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
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
      <MockedProvider addTypename={false} mocks={mocks}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ThemeProvider theme={theme}>
                <EditableUserTFAMethod
                  currentTFAMethod="NONE"
                  tfa={{
                    emailValidated: true,
                    phoneValidated: true,
                  }}
                />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
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
