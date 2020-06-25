import React from 'react'
import { createMemoryHistory } from 'history'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { Router, Route, Switch, MemoryRouter } from 'react-router-dom'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import Organizations from '../Organizations'
import { ORGANIZATIONS } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'

const mocks = [
  {
    request: {
      query: ORGANIZATIONS,
    },
    result: {
      data: {
        organizations: {
          edges: [
            {
              node: {
                name: 'Fisheries and Oceans Canada',
                slug: 'fisheries-and-oceans-canada',
                domainCount: 2,
              },
            },
            {
              node: {
                name: 'Treasury Board of Canada Secretariat',
                slug: 'treasury-board-secretariat',
                domainCount: 5,
              },
            },
          ],
        },
      },
    },
  },
]

describe('<Organisations />', () => {
  it('displays a list of organizations', async () => {
    const { getByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/organizations']} initialIndex={0}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <Organizations />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    await waitFor(() => expect(getByText(/Fisheries/i)).toBeInTheDocument())
  })

  it('displays a list of organizations', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/organizations'],
      initialIndex: 0,
    })

    const { getByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <Router history={history}>
                <Switch>
                  <Route
                    path="/organizations"
                    render={() => <Organizations />}
                  />
                </Switch>
              </Router>
            </MockedProvider>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    const link = await waitFor(() => getByText(/Fisheries and oceans/i))
    console.log(link)
    await waitFor(() => {
      fireEvent.click(link)
    })

    await waitFor(() =>
      expect(history.location.pathname).toEqual(
        '/organizations/fisheries-and-oceans-canada',
      ),
    )
  })
})
