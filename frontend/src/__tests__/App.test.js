import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { act, render, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import gql from 'graphql-tag'
import App from '../App'

i18n.load('en', { en: {} })
i18n.activate('en')

const mocks = [
  {
    request: {
      query: gql`
        {
          domains(organization: BOC) {
            url
          }
        }
      `,
      variables: {},
    },
    result: {
      data: {
        domains: [
          {
            url: 'canada.ca',
          },
          {
            url: 'alpha.canada.ca',
          },
        ],
      },
    },
  },
]

async function wait(ms = 0) {
  await act(() => {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  })
}

describe('<App/>', () => {
  afterEach(cleanup)

  describe('routes', () => {
    describe('/', () => {
      it('renders the main page', () => {
        const { getByRole } = render(
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <MockedProvider mocks={mocks}>
                  <App />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>,
        )
        expect(getByRole('heading')).toHaveTextContent(/track web/i)
      })
    })

    describe('/domains', () => {
      it('renders the domains page', async () => {
        const { getByRole } = render(
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                <MockedProvider mocks={mocks} addTypename={false}>
                  <App />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>,
        )
        await wait(0)
        expect(getByRole('heading')).toHaveTextContent(/Domains/i)
      })
    })
  })
})
