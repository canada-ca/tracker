import React from 'react'
import { waitFor, render } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { UserStateProvider } from '../UserState'
import { DOMAINS } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import DomainDetails from '../DomainDetails'

describe('<DomainDetails />', () => {
  describe('given a domain', () => {
    it("displays details about domain's scan results", async () => {
      const mocks = [
        {
          request: {
            query: DOMAINS,
          },
          result: {
            data: {
              domains: {
                edges: [
                  {
                    node: {
                      url: 'tbs-sct.gc.ca',
                      slug: 'tbs-sct-gc-ca',
                      lastRan: '2020-06-18T00:42:12.414Z',
                    },
                  },
                ],
                pageInfo: {
                  endCursor: 'YXJyYXljb25uZWN0aW9uOjI=',
                  hasNextPage: false,
                },
              },
            },
          },
        },
      ]
      const { getByText } = render(
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <UserStateProvider
              initialState={{
                userName: 'user@example.com',
                jwt: 'somestring',
                tfa: null,
              }}
            >
              <MockedProvider mocks={mocks} addTypename={false}>
                <MemoryRouter
                  initialEntries={['/organization/tbs-sct-gc-ca/tbs']}
                  initialIndex={0}
                >
                  <DomainDetails />
                </MemoryRouter>
              </MockedProvider>
            </UserStateProvider>
          </I18nProvider>
        </ThemeProvider>,
      )
      await waitFor(() => {
        expect(getByText(/Domain Scan Results/i)).toBeInTheDocument()
        expect(getByText(/2020-06-18T00:42:12.414Z/i)).toBeInTheDocument()
      })
    })
  })
})
