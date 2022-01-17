import React from 'react'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'

import { EditableUserLanguage } from '../EditableUserLanguage'

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

describe('<EditableUserLanguage />', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider addTypename={false}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ChakraProvider theme={theme}>
                <EditableUserLanguage />
              </ChakraProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
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
                  id: '1234asdf',
                  userName: 'testUser@canada.gc.ca',
                  displayName: 'test user',
                  tfaSendMethod: 'PHONE',
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
      <MockedProvider addTypename={false} mocks={mocks}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ChakraProvider theme={theme}>
                <EditableUserLanguage />
              </ChakraProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
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
      <MockedProvider addTypename={false} mocks={mocks}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ChakraProvider theme={theme}>
                <EditableUserLanguage />
              </ChakraProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
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
