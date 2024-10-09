import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import userEvent from '@testing-library/user-event'
import { makeVar } from '@apollo/client'

import { UserVarProvider } from '../../utilities/userState'
import { UPDATE_USER_PROFILE } from '../../graphql/mutations'
import { InsideUserSwitch } from '../InsideUserSwitch'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<InsideUserSwitch />', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ChakraProvider theme={theme}>
                <InsideUserSwitch insideUser={false} />
              </ChakraProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => expect(getByText(/Feature Preview/i)).toBeInTheDocument())
  })

  describe('When the user toggles their insider status', () => {
    it("succeeds in changing the user's status", async () => {
      const mocks = [
        {
          request: {
            query: UPDATE_USER_PROFILE,
            variables: { insideUser: true },
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
                    emailValidated: true,
                    insideUser: true,
                    __typename: 'PersonalUser',
                  },
                },
                __typename: 'UpdateUserProfilePayload',
              },
            },
          },
        },
      ]
      const { getByText, getByLabelText } = render(
        <MockedProvider mocks={mocks} addTypename={false}>
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
                  <InsideUserSwitch insideUser={false} />
                </ChakraProvider>
              </I18nProvider>
            </MemoryRouter>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => expect(getByText(/Feature Preview/i)).toBeInTheDocument())
      const betaSwitch = getByLabelText(/Feature Preview/i)
      userEvent.click(betaSwitch)
      await waitFor(() => expect(getByText(/Inside user status changed/i)))
    })
    it("fails when changing the user's status", async () => {
      const mocks = [
        {
          request: {
            query: UPDATE_USER_PROFILE,
            variables: { insideUser: true },
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
      const { getByText, getByLabelText } = render(
        <MockedProvider mocks={mocks} addTypename={false}>
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
                  <InsideUserSwitch insideUser={false} />
                </ChakraProvider>
              </I18nProvider>
            </MemoryRouter>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => expect(getByText(/Feature Preview/i)).toBeInTheDocument())
      const betaSwitch = getByLabelText(/Feature Preview/i)
      userEvent.click(betaSwitch)
      await waitFor(() => expect(getByText(/Unable to update to your inside user status, please try again./i)))
    })
  })
})
