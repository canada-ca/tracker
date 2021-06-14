import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter, Route, Switch, Router } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { PAGINATED_DMARC_REPORT_SUMMARY_TABLE as FORWARD } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import DmarcByDomainPage from '../DmarcByDomainPage'
import { rawDmarcReportSummaryTableData } from '../fixtures/dmarcReportSummaryTable'
import { createMemoryHistory } from 'history'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

describe('<DmarcByDomainPage />', () => {
  const mocks = [
    {
      request: {
        query: FORWARD,
        variables: {
          first: 10,
          month: 'LAST30DAYS',
          year: '2021',
          search: '',
          orderBy: {
            field: 'TOTAL_MESSAGES',
            direction: 'DESC',
          },
        },
      },
      result: rawDmarcReportSummaryTableData,
    },
  ]

  it('renders page header', async () => {
    const { getAllByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <DmarcByDomainPage />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>
      </MockedProvider>,
    )
    await waitFor(() => getAllByText(/^DMARC Summaries$/i))
  })

  it('renders date selector', async () => {
    const { getByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <DmarcByDomainPage />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>
      </MockedProvider>,
    )
    await waitFor(() => getByText(/Showing data for period:/i))
  })

  describe('summary table', () => {
    it('renders summary table', async () => {
      const { getByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <MockedProvider mocks={mocks} addTypename={false}>
                  <DmarcByDomainPage />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )
      await waitFor(() => getByText(/Total Messages/i))
    })

    it('displays domains', async () => {
      const { getByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <MockedProvider mocks={mocks} addTypename={false}>
                  <DmarcByDomainPage />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )
      await waitFor(() => {
        getByText(/martina.biz/)
      })
    })

    it('domain links bring user to DMARC report page', async () => {
      const history = createMemoryHistory({
        initialEntries: ['/dmarc-summaries'],
        initialIndex: 0,
      })

      const { getByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <MockedProvider mocks={mocks} addTypename={false}>
                  <Router history={history}>
                    <Switch>
                      <Route
                        path="/dmarc-summaries"
                        render={() => <DmarcByDomainPage />}
                      />
                    </Switch>
                  </Router>
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      await waitFor(() => {
        const domainLink = getByText(/martina.biz/)
        fireEvent.click(domainLink)
        expect(history.location.pathname).toEqual(
          '/domains/martina.biz/dmarc-report/LAST30DAYS/2021',
        )
      })
    })

    describe('pagination controls', () => {
      it('next button goes to next page', async () => {
        const { getByText, queryByText } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <MockedProvider mocks={mocks} addTypename={false}>
                    <DmarcByDomainPage />
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
        )
        // don't expect last domain

        await waitFor(() => {
          expect(queryByText(/last-domain.info/)).not.toBeInTheDocument()
        })
        // click next page button
        await waitFor(() => {
          const nextPage = getByText(/Next/)
          fireEvent.click(nextPage)
        })
        // expect last domain
        await waitFor(() => {
          expect(queryByText(/last-domain.info/)).toBeInTheDocument()
        })
      })

      it('increases items per page', async () => {
        const { queryByText, getByLabelText } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <MockedProvider mocks={mocks} addTypename={false}>
                    <DmarcByDomainPage />
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
        )

        await waitFor(() => {
          expect(queryByText(/last-domain.info/)).not.toBeInTheDocument()
        })

        const itemsPerPage = getByLabelText('Items per page')
        await waitFor(() => {
          fireEvent.change(itemsPerPage, { target: { value: 20 } })
          fireEvent.blur(itemsPerPage)
        })

        // await waitFor(() => {
        //   expect(queryByText(/last-domain.info/)).toBeInTheDocument()
        // })
      })
    })
  })
})
