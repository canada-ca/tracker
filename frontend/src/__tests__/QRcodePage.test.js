import React from 'react'
import { QRcodePage } from '../QRcodePage'
import { i18n } from '@lingui/core'
import gql from 'graphql-tag'
import { waitFor, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/react-testing'

i18n.load('en', { en: {} })
i18n.activate('en')

const resolvers = {
  Query: {
    jwt: () => null,
    tfa: () => null,
  },
}

describe('<QRcodePage />', () => {
  describe('given a userName prop', () => {
    it('renders an OTP as an SVG QR code', async () => {
      const userName = 'foo@example.com'
      const mocks = [
        {
          request: {
            query: gql`
              query GenerateOtpUrl($userName: EmailAddress!) {
                generateOtpUrl(userName: $userName)
              }
            `,
            variables: { userName },
          },
          result: {
            data: {
              generateOtpUrl:
                'otpauth://totp/Secure%20App:foo%40google.com?secret=XXXXXXXXXXXXXXX&issuer=Secure%20App',
            },
          },
        },
      ]
      const { queryByText, getByRole } = render(
        <MockedProvider mocks={mocks} resolvers={resolvers}>
          <MemoryRouter initialEntries={['/']}>
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <QRcodePage userName={userName} />
              </I18nProvider>
            </ThemeProvider>
          </MemoryRouter>
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
