import React from 'react'
import { waitFor, render } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { UserStateProvider } from '../UserState'
import { ORGANIZATION_BY_SLUG } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import OrganizationDetails from '../OrganizationDetails'

describe('<OrganizationDetails />', () => {
  describe('given the url /organisations/tbs-sct-gc-ca', () => {
    it('displays details using the tbs-sct-gc-ca slug', async () => {
      const name = 'Treasury Board Secretariat'

      const mocks = [
        {
          request: {
            query: ORGANIZATION_BY_SLUG,
          },
          result: {
            data: {
              organization: {
                id: 'ODk3MDg5MzI2MA==',
                name,
                acronym: 'TBS',
                province: 'ON',
                domains: {
                  edges: [
                    {
                      node: {
                        id: 'OTY2NTI4OTY4NA==',
                        url: 'tbs-sct.gc.ca',
                        lastRan: '2020-06-18T00:42:12.414Z',
                      },
                    },
                  ],
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
                  initialEntries={['/organization/tbs-sct-gc-ca']}
                  initialIndex={0}
                >
                  <OrganizationDetails />
                </MemoryRouter>
              </MockedProvider>
            </UserStateProvider>
          </I18nProvider>
        </ThemeProvider>,
      )

      await waitFor(() => {
        expect(getByText(name)).toBeInTheDocument()
        expect(getByText(/2020-06-18T00:42:12.414Z/)).toBeInTheDocument()
      })
    })
  })
})
