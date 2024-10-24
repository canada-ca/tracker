import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter, Route, Router, Routes } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory } from 'history'

import DmarcReportPage from '../DmarcReportPage'

import { createCache } from '../../client'
import { UserVarProvider } from '../../utilities/userState'
import { rawDmarcReportGraphData, rawDmarcReportGraphDataWithoutReport } from '../../fixtures/dmarcReportGraphData'
import { rawDmarcReportData, augustDmarcReportData } from '../../fixtures/dmarcReportData.js'

import { DMARC_REPORT_GRAPH, PAGINATED_DMARC_REPORT } from '../../graphql/queries'

// ** need to mock the ResizeObserver and polute the window object to avoid errors
class ResizeObserver {
  observe() {
    // do nothing
  }

  unobserve() {
    // do nothing
  }

  disconnect() {
    // do nothing
  }
}

window.ResizeObserver = ResizeObserver
// **

const d = new Date()
const currentYear = d.getFullYear()
// dynamic year value, changes in September
const getDynamicYear = () => {
  const currentMonth = d.getMonth()
  if (currentMonth >= 8) {
    return String(currentYear)
  } else {
    return String(currentYear - 1)
  }
}

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

describe('<DmarcReportPage />', () => {
  describe('when hasDMARCReport is true', () => {
    const mocks = [
      {
        request: {
          query: DMARC_REPORT_GRAPH,
          variables: {
            domain: 'test-domain',
          },
        },
        result: rawDmarcReportGraphData,
      },
      {
        request: {
          query: PAGINATED_DMARC_REPORT,
          variables: {
            domain: 'test-domain',
            month: 'LAST30DAYS',
            year: String(currentYear),
            first: 50,
            after: '',
          },
        },
        result: rawDmarcReportData,
      },
      {
        request: {
          query: PAGINATED_DMARC_REPORT,
          variables: {
            domain: 'test-domain',
            month: 'AUGUST',
            year: getDynamicYear(),
            first: 50,
            after: '',
          },
        },
        result: augustDmarcReportData,
      },
    ]

    it('renders header', async () => {
      const { getAllByText } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter
                  initialEntries={[`/domains/test-domain/dmarc-report/LAST30DAYS/${currentYear}`]}
                  initialIndex={0}
                >
                  <Routes>
                    <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?" element={<DmarcReportPage />} />
                  </Routes>
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>
      );
      
      await waitFor(() => getAllByText(/test-domain/i))
    })

    it('renders date selector', async () => {
      const { getAllByText } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter
                  initialEntries={[`/domains/test-domain/dmarc-report/LAST30DAYS/${currentYear}`]}
                  initialIndex={0}
                >
                  <Routes>
                    <Route 
                      path="/domains/:domainSlug/dmarc-report/:period?/:year?" 
                      element={<DmarcReportPage />} 
                    />
                  </Routes>
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>
      );
      
      await waitFor(() => getAllByText(/Showing data for period:/i))
    })

    it('renders bar graph', async () => {
      const { getByText } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter
                  initialEntries={[`/domains/test-domain/dmarc-report/LAST30DAYS/${currentYear}`]}
                  initialIndex={0}
                >
                  <Routes>
                    <Route 
                      path="/domains/:domainSlug/dmarc-report/:period?/:year?" 
                      element={<DmarcReportPage />} 
                    />
                  </Routes>
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>
      );
      
      await waitFor(() => getByText(/Mar-20/))
    })

    it('renders tables', async () => {
      const { getByRole, findByRole } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter
                  initialEntries={[`/domains/test-domain/dmarc-report/LAST30DAYS/${currentYear}`]}
                  initialIndex={0}
                >
                  <Routes>
                    <Route 
                      path="/domains/:domainSlug/dmarc-report/:period?/:year?" 
                      element={<DmarcReportPage />} 
                    />
                  </Routes>
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>
      );
      
      await findByRole('button', { name: /DKIM Failures by IP Address/i })
      getByRole('button', { name: /SPF Failures by IP Address/i })
      getByRole('button', { name: /Fully Aligned by IP Address/i })
      getByRole('button', { name: /DMARC Failures by IP Address/i })
    })

    describe('changes period tables', () => {
      it('the url changes', async () => {
        const history = createMemoryHistory({
          initialEntries: [`/domains/test-domain/dmarc-report/LAST30DAYS/${currentYear}`],
          initialIndex: 0,
        });
    
        const { getByRole, findByRole } = render(
          <MockedProvider mocks={mocks} cache={createCache()}>
            <UserVarProvider
              userVar={makeVar({
                jwt: null,
                tfaSendMethod: null,
                userName: null,
              })}
            >
              <ChakraProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MemoryRouter initialEntries={[`/domains/test-domain/dmarc-report/LAST30DAYS/${currentYear}`]}>
                    <Routes>
                      <Route 
                        path="/domains/:domainSlug/dmarc-report/:period?/:year?" 
                        element={<DmarcReportPage />} 
                      />
                    </Routes>
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>
        );
    
        await findByRole('button', { name: /Fully Aligned by IP Address/i });
    
        const periodSelector = getByRole('combobox', {
          name: /Showing data for period/i,
        });
    
        expect(window.location.pathname).toEqual(`/domains/test-domain/dmarc-report/LAST30DAYS/${currentYear}`);
    
        userEvent.selectOptions(periodSelector, `AUGUST, ${getDynamicYear()}`);
    
        expect(window.location.pathname).toEqual(`/domains/test-domain/dmarc-report/AUGUST/${getDynamicYear()}`);
      });
    
      it('the data changes', async () => {
        const { getByRole, findByRole, queryByText } = render(
          <MockedProvider mocks={mocks} cache={createCache()}>
            <UserVarProvider
              userVar={makeVar({
                jwt: null,
                tfaSendMethod: null,
                userName: null,
              })}
            >
              <ChakraProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MemoryRouter initialEntries={[`/domains/test-domain/dmarc-report/LAST30DAYS/${currentYear}`]}>
                    <Routes>
                      <Route 
                        path="/domains/:domainSlug/dmarc-report/:period?/:year?" 
                        element={<DmarcReportPage />} 
                      />
                    </Routes>
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>
        );
    
        await findByRole('button', { name: /Fully Aligned by IP Address/i });
    
        const periodSelector = getByRole('combobox', {
          name: /Showing data for period/i,
        });
    
        expect(window.location.pathname).toEqual(`/domains/test-domain/dmarc-report/LAST30DAYS/${currentYear}`);
    
        expect(queryByText(/full-pass-dkim-domains-L30D.domain/)).toBeInTheDocument();
        expect(queryByText(/dkim-failure-dkim-domains-L30D.domain/)).toBeInTheDocument();
        expect(queryByText(/spf-failure-spf-domains-L30D.domain/)).toBeInTheDocument();
        expect(queryByText(/dmarc-failure-dkim-domains-L30D.domain/)).toBeInTheDocument();
    
        expect(queryByText(/full-pass-dkim-domains-august.domain/)).not.toBeInTheDocument();
        expect(queryByText(/dkim-failure-dkim-domains-august.domain/)).not.toBeInTheDocument();
        expect(queryByText(/spf-failure-spf-domains-august.domain/)).not.toBeInTheDocument();
        expect(queryByText(/dmarc-failure-dkim-domains-august.domain/)).not.toBeInTheDocument();
    
        userEvent.selectOptions(periodSelector, `AUGUST, ${getDynamicYear()}`);
    
        expect(window.location.pathname).toEqual(`/domains/test-domain/dmarc-report/AUGUST/${getDynamicYear()}`);
    
        await findByRole('button', { name: /Fully Aligned by IP Address/i });
    
        expect(queryByText(/full-pass-dkim-domains-L30D.domain/)).not.toBeInTheDocument();
        expect(queryByText(/dkim-failure-dkim-domains-L30D.domain/)).not.toBeInTheDocument();
        expect(queryByText(/spf-failure-spf-domains-L30D.domain/)).not.toBeInTheDocument();
        expect(queryByText(/dmarc-failure-dkim-domains-L30D.domain/)).not.toBeInTheDocument();
    
        expect(queryByText(/full-pass-dkim-domains-august.domain/)).toBeInTheDocument();
        expect(queryByText(/dkim-failure-dkim-domains-august.domain/)).toBeInTheDocument();
        expect(queryByText(/spf-failure-spf-domains-august.domain/)).toBeInTheDocument();
        expect(queryByText(/dmarc-failure-dkim-domains-august.domain/)).toBeInTheDocument();
      });
    });
    
  })

  describe('when hasDMARCReport is false', () => {
    it('Shows message when domain does not support aggregate data', async () => {
      const mocks = [
        {
          request: {
            query: DMARC_REPORT_GRAPH,
            variables: {
              domain: 'test-domain',
            },
          },
          result: rawDmarcReportGraphDataWithoutReport,
        },
        {
          request: {
            query: PAGINATED_DMARC_REPORT,
            variables: {
              domain: 'test-domain',
              month: 'LAST30DAYS',
              year: String(currentYear),
              first: 50,
              after: '',
            },
          },
          result: {
            data: {
              findDomainByDomain: {
                id: 'asdf',
                dmarcSummaryByPeriod: null,
                hasDMARCReport: false,
              },
            },
          },
        },
      ]

      const { findByText } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter
                  initialEntries={[`/domains/test-domain/dmarc-report/LAST30DAYS/${currentYear}`]}
                  initialIndex={0}
                >
                  <Routes>
                    <Route 
                      path="/domains/:domainSlug/dmarc-report/:period?/:year?" 
                      element={<DmarcReportPage />} 
                    />
                  </Routes>
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>
      );
      

      await findByText(/test-domain does not support aggregate data/)
    })
  })
})
