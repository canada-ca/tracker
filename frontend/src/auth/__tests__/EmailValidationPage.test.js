import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import EmailValidationPage from '../EmailValidationPage'
import { UserVarProvider } from '../../utilities/userState'
import { VERIFY_ACCOUNT } from '../../graphql/mutations'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

const successMocks = [
  {
    request: {
      query: VERIFY_ACCOUNT,
      variables: {
        verifyToken: 'fwsdGDFSGSDVA.gedafbedafded.bgdbsedbeagbe',
      },
    },
    result: {
      data: {
        verifyAccount: {
          result: {
            status: 'Hello World',
            __typename: 'VerifyAccountResult',
          },
        },
      },
    },
  },
]

const failMocks = [
  {
    request: {
      query: VERIFY_ACCOUNT,
    },
    result: {
      data: {
        verifyAccount: {
          result: {
            code: -96,
            description: 'Hello World',
            __typename: 'VerifyAccountError',
          },
        },
      },
    },
  },
]

const router = createMemoryRouter(
  [
    {
      path: '/validate/:verifyToken',
      element: <EmailValidationPage />,
    },
  ],
  {
    initialEntries: ['/validate/fwsdGDFSGSDVA.gedafbedafded.bgdbsedbeagbe'],
    initialIndex: 0,
  },
)

describe('<EmailValidationPage />', () => {
  describe('after loading mutation', () => {
    it('displays an error message', async () => {
      const { queryByText } = render(
        <MockedProvider mocks={failMocks}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <RouterProvider router={router}>
                  <EmailValidationPage />
                </RouterProvider>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() =>
        expect(
          queryByText(/Your account email could not be verified at this time. Please try again./),
        ).toBeInTheDocument(),
      )
    })

    it('displays a success message', async () => {
      const { queryByText } = render(
        <MockedProvider mocks={successMocks}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <RouterProvider router={router}>
                  <EmailValidationPage />
                </RouterProvider>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => expect(queryByText(/Your account email was successfully verified/)).toBeInTheDocument())
    })
  })
})
