import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import { AggregatedGuidanceSummary } from '../AggregatedGuidanceSummary'

import { UserVarProvider } from '../../utilities/userState'
import { ORG_NEGATIVE_FINDINGS } from '../../graphql/queries'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

describe('<AggregatedGuidanceSummary />', () => {
  const mocks = [
    {
      request: {
        query: ORG_NEGATIVE_FINDINGS,
        variables: { orgSlug: 'tbs-sct-gc-ca' },
      },
      result: {
        data: {
          findOrganizationBySlug: {
            id: 'fgwsgwsf',
            summaries: {
              negativeFindings: {
                totalCount: 2,
                guidanceTags: [
                  {
                    tagId: 'tag2',
                    tagName: 'TAG-short-age',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Aut autem consequatur ipsam aliquam sunt et at pariatur suscipit.',
                        refLink: 'http://zita.com',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Recusandae dolor quidem et repellendus iure sit aliquam.',
                        refLink: 'http://audie.org',
                      },
                    ],
                    count: 10,
                  },

                  {
                    tagId: 'tag9',
                    tagName: 'TAG-certificate-expired',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Vitae cum molestias veritatis.',
                        refLink: 'https://michaela.com',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Voluptatem repudiandae accusantium ratione ea sed.',
                        refLink: 'https://dennis.name',
                      },
                    ],
                    count: 5,
                  },
                ],
              },
            },
          },
        },
      },
    },
  ]
  it('renders correctly', async () => {
    const { getByText } = render(
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MockedProvider mocks={mocks} addTypename={false}>
            <UserVarProvider
              userVar={makeVar({
                jwt: null,
                tfaSendMethod: null,
                userName: null,
              })}
            >
              <AggregatedGuidanceSummary orgSlug="tbs-sct-gc-ca" />
            </UserVarProvider>
          </MockedProvider>
        </I18nProvider>
      </ChakraProvider>,
    )
    await waitFor(() => {
      expect(getByText(/TAG-short-age/i)).toBeInTheDocument()
    })
  })

  it('displays error message on error', async () => {
    const errorMocks = [
      {
        request: {
          query: ORG_NEGATIVE_FINDINGS,
          variables: { orgSlug: 'tbs-sct-gc-ca' },
        },
        error: new Error('An error occurred'),
      },
    ]

    const { getByText } = render(
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MockedProvider mocks={errorMocks} addTypename={false}>
            <UserVarProvider
              userVar={makeVar({
                jwt: null,
                tfaSendMethod: null,
                userName: null,
              })}
            >
              <AggregatedGuidanceSummary orgSlug="tbs-sct-gc-ca" />
            </UserVarProvider>
          </MockedProvider>
        </I18nProvider>
      </ChakraProvider>,
    )
    await waitFor(() => {
      expect(getByText(/An error occurred/i)).toBeInTheDocument()
    })
  })

  it('displays no findings message when there are no negative findings', async () => {
    const noFindingsMocks = [
      {
        request: {
          query: ORG_NEGATIVE_FINDINGS,
          variables: { orgSlug: 'tbs-sct-gc-ca' },
        },
        result: {
          data: {
            findOrganizationBySlug: {
              id: 'fgwsgwsf',
              summaries: {
                negativeFindings: {
                  totalCount: 0,
                  guidanceTags: [],
                },
              },
            },
          },
        },
      },
    ]

    const { getByText } = render(
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MockedProvider mocks={noFindingsMocks} addTypename={false}>
            <UserVarProvider
              userVar={makeVar({
                jwt: null,
                tfaSendMethod: null,
                userName: null,
              })}
            >
              <AggregatedGuidanceSummary orgSlug="tbs-sct-gc-ca" />
            </UserVarProvider>
          </MockedProvider>
        </I18nProvider>
      </ChakraProvider>,
    )
    await waitFor(() => {
      expect(getByText(/No negative findings to show/i)).toBeInTheDocument()
    })
  })
})
