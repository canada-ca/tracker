import React from 'react'
import QRcodePage from '../QRcodePage'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { UserVarProvider } from '../UserState'
import { GENERATE_OTP_URL } from '../graphql/queries'
import { setupI18n } from '@lingui/core'
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

const email = 'foo@example.com'

describe('<QRcodePage />', () => {
  describe('given a logged in user', () => {
    it('renders an OTP as an SVG QR code', async () => {
      const mocks = [
        {
          request: {
            query: GENERATE_OTP_URL,
            variables: { email },
          },
          result: {
            data: {
              generateOtpUrl:
                'otpauth://totp/Secure%20App:foo%40example.com?secret=XXXXXXXXXXXXXXX&issuer=Secure%20App',
            },
          },
        },
      ]
      const { queryByText, getByRole } = render(
        <MockedProvider mocks={mocks}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: email,
            })}
          >
            <MemoryRouter initialEntries={['/']}>
              <ChakraProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <QRcodePage />
                </I18nProvider>
              </ChakraProvider>
            </MemoryRouter>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => {
        const qrcode = getByRole('img')
        expect(qrcode.nodeName).toEqual('svg')
        expect(queryByText(/Scan this QR code/i)).toBeInTheDocument()
      })
    })
  })
})
