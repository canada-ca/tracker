import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { gql, InMemoryCache } from '@apollo/client'
import { MockedProvider } from '@apollo/client/testing'
import { renderHook } from '@testing-library/react-hooks'
import { relayStylePagination } from '@apollo/client/utilities'

import { usePaginatedCollection } from '../../utilities/usePaginatedCollection'
import { createCache } from '../../client'

describe('usePaginatedCollection', () => {
  describe('given forward/backward queries', () => {
    const FORWARD = gql`
      query($after: String, $first: Int) {
        pagination: repositories(first: $first, after: $after) {
          edges {
            cursor
            node {
              id
              name
              __typename
            }
            __typename
          }
          pageInfo {
            hasNextPage
            endCursor
            hasPreviousPage
            startCursor
            __typename
          }
          __typename
        }
      }
    `

    const BACKWARD = gql`
      query($before: String, $last: Int) {
        pagination: repositories(before: $before, last: $last) {
          edges {
            cursor
            node {
              id
              name
              __typename
            }
            __typename
          }
          pageInfo {
            hasNextPage
            endCursor
            hasPreviousPage
            startCursor
            __typename
          }
          __typename
        }
      }
    `

    it('returns a previous function that loads previous records', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: { first: 1 },
          },
          result: {
            data: {
              pagination: {
                edges: [
                  {
                    cursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                    node: {
                      id: 'MDEwOlJlcG9zaXRvcnk1MTYyMjE=',
                      name: 'repo one',
                      __typename: 'Repository',
                    },
                    __typename: 'RepositoryEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                  hasPreviousPage: false,
                  startCursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                  __typename: 'PageInfo',
                },
                __typename: 'RepositoryConnection',
              },
            },
          },
        },
        {
          request: {
            query: FORWARD,
            variables: { first: 1, after: 'Y3Vyc29yOnYyOpHOAAfgfQ==' },
          },
          result: {
            data: {
              pagination: {
                edges: [
                  {
                    cursor: 'Y3Vyc29yOnYyOpHOAA_zRw==',
                    node: {
                      id: 'MDEwOlJlcG9zaXRvcnkxMDQ1MzE5',
                      name: 'repo two',
                      __typename: 'Repository',
                    },
                    __typename: 'RepositoryEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: 'Y3Vyc29yOnYyOpHOAA_zRw==',
                  hasPreviousPage: true,
                  startCursor: 'Y3Vyc29yOnYyOpHOAA_zRw==',
                  __typename: 'PageInfo',
                },
                __typename: 'RepositoryConnection',
              },
            },
          },
        },
        {
          request: {
            query: FORWARD,
            variables: { first: 1, after: 'Y3Vyc29yOnYyOpHOAAfgfQ==' },
          },
          result: {
            data: {
              pagination: {
                edges: [
                  {
                    cursor: 'Y3Vyc29yOnYyOpHOAA_zRw==',
                    node: {
                      id: 'MDEwOlJlcG9zaXRvcnkxMDQ1MzE5',
                      name: 'repo two',
                      __typename: 'Repository',
                    },
                    __typename: 'RepositoryEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: 'Y3Vyc29yOnYyOpHOAA_zRw==',
                  hasPreviousPage: true,
                  startCursor: 'Y3Vyc29yOnYyOpHOAA_zRw==',
                  __typename: 'PageInfo',
                },
                __typename: 'RepositoryConnection',
              },
            },
          },
        },
        {
          request: {
            query: BACKWARD,
            variables: { last: 1, before: 'Y3Vyc29yOnYyOpHOAA_zRw==' },
          },
          result: {
            data: {
              pagination: {
                edges: [
                  {
                    cursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                    node: {
                      id: 'MDEwOlJlcG9zaXRvcnk1MTYyMjE=',
                      name: 'repo one',
                      __typename: 'Repository',
                    },
                    __typename: 'RepositoryEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                  hasPreviousPage: false,
                  startCursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                  __typename: 'PageInfo',
                },
                __typename: 'RepositoryConnection',
              },
            },
          },
        },
      ]

      const cache = new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              repositories: relayStylePagination(),
            },
          },
        },
      })

      function Foo() {
        const { nodes, next, previous } = usePaginatedCollection({
          fetchForward: FORWARD,
          fetchBackward: BACKWARD,
          recordsPerPage: 1,
          relayRoot: 'pagination',
        })

        return (
          <div>
            <ul>{nodes && nodes.map((n) => <li key={n.id}>{n.name}</li>)}</ul>
            <button onClick={next}>next</button>
            <button onClick={previous}>previous</button>
          </div>
        )
      }

      const { getAllByText, queryByText, getByRole } = render(
        <MockedProvider mocks={mocks} cache={cache}>
          <Foo />
        </MockedProvider>,
      )

      await waitFor(() => {
        expect(queryByText(/repo one/)).toBeInTheDocument()
        expect(getAllByText(/repo one/)).toHaveLength(1)
      })

      const next = getByRole('button', { name: /next/ })

      fireEvent.click(next)

      await waitFor(() => {
        expect(queryByText(/repo one/)).not.toBeInTheDocument()
        expect(queryByText(/repo two/)).toBeInTheDocument()
        expect(getAllByText(/repo two/)).toHaveLength(1)
      })

      const previous = getByRole('button', { name: /previous/ })

      fireEvent.click(previous)

      await waitFor(() => {
        expect(queryByText(/repo two/)).not.toBeInTheDocument()
        expect(queryByText(/repo one/)).toBeInTheDocument()
        expect(getAllByText(/repo one/)).toHaveLength(1)
      })
    })

    it('correctly displays ten more results', async () => {
      const forward = gql`
        query Domains($first: Int, $after: String) {
          pagination: findMyDomains(first: $first, after: $after) {
            edges {
              cursor
              node {
                id
                url
                slug
                lastRan
                __typename
              }
              __typename
            }
            pageInfo {
              hasNextPage
              endCursor
              hasPreviousPage
              startCursor
              __typename
            }
            __typename
          }
        }
      `
      const mocks = [
        {
          request: { query: forward, variables: { first: 10 } },
          result: {
            data: {
              pagination: {
                edges: [
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    node: {
                      id: 'RG9tYWluOjM5OTA=',
                      url: 'alimentsnouveaux.gc.ca',
                      slug: 'alimentsnouveaux-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjE=',
                    node: {
                      id: 'RG9tYWluOjM5OTE=',
                      url: 'aliments-nutrition.canada.ca',
                      slug: 'aliments-nutrition-canada-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjI=',
                    node: {
                      id: 'RG9tYWluOjM5OTI=',
                      url: 'app80.hc-sc.gc.ca',
                      slug: 'app80-hc-sc-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjM=',
                    node: {
                      id: 'RG9tYWluOjM5OTM=',
                      url: 'apps.hc-sc.gc.ca',
                      slug: 'apps-hc-sc-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjQ=',
                    node: {
                      id: 'RG9tYWluOjM5OTQ=',
                      url: 'beactive.gc.ca',
                      slug: 'beactive-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjU=',
                    node: {
                      id: 'RG9tYWluOjM5OTU=',
                      url: 'biosecurity-portal.hc-sc.gc.ca',
                      slug: 'biosecurity-portal-hc-sc-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjY=',
                    node: {
                      id: 'RG9tYWluOjM5OTY=',
                      url: 'biosecurity-portal.uat.hc-sc.gc.ca',
                      slug: 'biosecurity-portal-uat-hc-sc-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjc=',
                    node: {
                      id: 'RG9tYWluOjM5OTc=',
                      url: 'bureauweb.hc-sc.gc.ca',
                      slug: 'bureauweb-hc-sc-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjg=',
                    node: {
                      id: 'RG9tYWluOjM5OTg=',
                      url: 'camr.gc.ca',
                      slug: 'camr-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjk=',
                    node: {
                      id: 'RG9tYWluOjM5OTk=',
                      url: 'camr-rcam.gc.ca',
                      slug: 'camr-rcam-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: 'YXJyYXljb25uZWN0aW9uOjk=',
                  hasPreviousPage: false,
                  startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                  __typename: 'PageInfo',
                },
                __typename: 'DomainConnection',
              },
            },
          },
        },
        {
          request: {
            query: forward,
            variables: { first: 10, after: 'YXJyYXljb25uZWN0aW9uOjk=' },
          },
          result: {
            data: {
              pagination: {
                edges: [
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjEw',
                    node: {
                      id: 'RG9tYWluOjQwMDA=',
                      url: 'canadianbiosafetystandards.collaboration.gc.ca',
                      slug: 'canadianbiosafetystandards-collaboration-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjEx',
                    node: {
                      id: 'RG9tYWluOjQwMDE=',
                      url: 'canadiensensante.gc.ca',
                      slug: 'canadiensensante-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjEy',
                    node: {
                      id: 'RG9tYWluOjQwMDI=',
                      url: 'chemicalsubstances.gc.ca',
                      slug: 'chemicalsubstances-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjEz',
                    node: {
                      id: 'RG9tYWluOjQwMDM=',
                      url: 'chemicalsubstanceschimiques.gc.ca',
                      slug: 'chemicalsubstanceschimiques-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjE0',
                    node: {
                      id: 'RG9tYWluOjQwMDQ=',
                      url: 'clf2-nsi2.hc-sc.gc.ca',
                      slug: 'clf2-nsi2-hc-sc-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjE1',
                    node: {
                      id: 'RG9tYWluOjQwMDU=',
                      url: 'clinical-information.canada.ca',
                      slug: 'clinical-information-canada-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjE2',
                    node: {
                      id: 'RG9tYWluOjQwMDY=',
                      url: 'clin-rcil.hc-sc.gc.ca',
                      slug: 'clin-rcil-hc-sc-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjE3',
                    node: {
                      id: 'RG9tYWluOjQwMDc=',
                      url: 'collaboration.hc-sc.gc.ca',
                      slug: 'collaboration-hc-sc-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjE4',
                    node: {
                      id: 'RG9tYWluOjQwMDg=',
                      url: 'collaboration-uat-tau.hc-sc.gc.ca',
                      slug: 'collaboration-uat-tau-hc-sc-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjE5',
                    node: {
                      id: 'RG9tYWluOjQwMDk=',
                      url: 'competitions.hc-sc.gc.ca',
                      slug: 'competitions-hc-sc-gc-ca',
                      lastRan: '2020-08-13T14:42:03.385294',
                      __typename: 'Domain',
                    },
                    __typename: 'DomainEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: 'YXJyYXljb25uZWN0aW9uOjE5',
                  hasPreviousPage: false,
                  startCursor: 'YXJyYXljb25uZWN0aW9uOjEw',
                  __typename: 'PageInfo',
                },
                __typename: 'DomainConnection',
              },
            },
          },
        },
      ]

      function Foo() {
        const { nodes, next } = usePaginatedCollection({
          fetchForward: forward,
          fetchBackward: forward,
          recordsPerPage: 10,
          relayRoot: 'pagination',
        })

        return (
          <div>
            <ul>{nodes && nodes.map((n) => <li key={n.id}>{n.url}</li>)}</ul>
            <button onClick={next}>next</button>
          </div>
        )
      }

      const { queryByText, getByRole } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <Foo />
        </MockedProvider>,
      )

      await waitFor(() => {
        expect(queryByText('alimentsnouveaux.gc.ca')).toBeInTheDocument()
        expect(queryByText('aliments-nutrition.canada.ca')).toBeInTheDocument()
        expect(queryByText('app80.hc-sc.gc.ca')).toBeInTheDocument()
        expect(queryByText('apps.hc-sc.gc.ca')).toBeInTheDocument()
        expect(queryByText('beactive.gc.ca')).toBeInTheDocument()
        expect(
          queryByText('biosecurity-portal.hc-sc.gc.ca'),
        ).toBeInTheDocument()
        expect(
          queryByText('biosecurity-portal.uat.hc-sc.gc.ca'),
        ).toBeInTheDocument()
        expect(queryByText('bureauweb.hc-sc.gc.ca')).toBeInTheDocument()
        expect(queryByText('camr.gc.ca')).toBeInTheDocument()
        expect(queryByText('camr-rcam.gc.ca')).toBeInTheDocument()
      })

      const next = getByRole('button', { name: /next/ })

      fireEvent.click(next)

      await waitFor(() => {
        expect(
          queryByText('canadianbiosafetystandards.collaboration.gc.ca'),
        ).toBeInTheDocument()
        expect(queryByText('canadiensensante.gc.ca')).toBeInTheDocument()
        expect(queryByText('chemicalsubstances.gc.ca')).toBeInTheDocument()
        expect(
          queryByText('chemicalsubstanceschimiques.gc.ca'),
        ).toBeInTheDocument()
        expect(queryByText('clf2-nsi2.hc-sc.gc.ca')).toBeInTheDocument()
        expect(
          queryByText('clinical-information.canada.ca'),
        ).toBeInTheDocument()
        expect(queryByText('clin-rcil.hc-sc.gc.ca')).toBeInTheDocument()
        expect(queryByText('collaboration.hc-sc.gc.ca')).toBeInTheDocument()
        expect(
          queryByText('collaboration-uat-tau.hc-sc.gc.ca'),
        ).toBeInTheDocument()
        expect(queryByText('competitions.hc-sc.gc.ca')).toBeInTheDocument()
      })
    })
    it('returns a next function that loads more records', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: { first: 1 },
          },
          result: {
            data: {
              pagination: {
                edges: [
                  {
                    cursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                    node: {
                      id: 'MDEwOlJlcG9zaXRvcnk1MTYyMjE=',
                      name: 'wrong-side-of-the-tracks',
                      __typename: 'Repository',
                    },
                    __typename: 'RepositoryEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                  hasPreviousPage: false,
                  startCursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                  __typename: 'PageInfo',
                },
                __typename: 'RepositoryConnection',
              },
            },
          },
        },
        {
          request: {
            query: FORWARD,
            variables: { first: 1, after: 'Y3Vyc29yOnYyOpHOAAfgfQ==' },
          },
          result: {
            data: {
              pagination: {
                edges: [
                  {
                    cursor: 'Y3Vyc29yOnYyOpHOAA_zRw==',
                    node: {
                      id: 'MDEwOlJlcG9zaXRvcnkxMDQ1MzE5',
                      name: 'deploy-gitorious',
                      __typename: 'Repository',
                    },
                    __typename: 'RepositoryEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: 'Y3Vyc29yOnYyOpHOAA_zRw==',
                  hasPreviousPage: true,
                  startCursor: 'Y3Vyc29yOnYyOpHOAA_zRw==',
                  __typename: 'PageInfo',
                },
                __typename: 'RepositoryConnection',
              },
            },
          },
        },
      ]

      // This relies on the cache knowing how to handle incoming results.
      const cache = new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              repositories: relayStylePagination(),
            },
          },
        },
      })

      function Foo() {
        const { nodes, next } = usePaginatedCollection({
          fetchForward: FORWARD,
          fetchBackward: BACKWARD,
          recordsPerPage: 1,
          relayRoot: 'pagination',
        })

        return (
          <div>
            <ul>{nodes && nodes.map((n) => <li key={n.id}>{n.name}</li>)}</ul>
            <button onClick={next}>next</button>
          </div>
        )
      }

      const { getAllByText, queryByText, getByRole } = render(
        <MockedProvider mocks={mocks} cache={cache}>
          <Foo />
        </MockedProvider>,
      )

      await waitFor(() => {
        expect(queryByText(/wrong-side-of-the-tracks/)).toBeInTheDocument()
        expect(getAllByText(/wrong-side-of-the-tracks/)).toHaveLength(1)
      })

      const next = getByRole('button', { name: /next/ })

      fireEvent.click(next)

      await waitFor(() => {
        expect(queryByText(/deploy-gitorious/)).toBeInTheDocument()
        expect(getAllByText(/deploy-gitorious/)).toHaveLength(1)
      })
    })

    it('returns hasNextPage which reflects the value returned from the query', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: { first: 1 },
          },
          result: {
            data: {
              pagination: {
                edges: [
                  {
                    cursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                    node: {
                      id: 'MDEwOlJlcG9zaXRvcnk1MTYyMjE=',
                      name: 'wrong-side-of-the-tracks',
                      __typename: 'Repository',
                    },
                    __typename: 'RepositoryEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                  hasPreviousPage: false,
                  startCursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                  __typename: 'PageInfo',
                },
                __typename: 'RepositoryConnection',
              },
            },
          },
        },
      ]

      const cache = new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              repositories: relayStylePagination(),
            },
          },
        },
      })

      const wrapper = ({ children }) => {
        return (
          <MockedProvider mocks={mocks} cache={cache}>
            {children}
          </MockedProvider>
        )
      }

      const { result, waitForNextUpdate } = renderHook(
        () =>
          usePaginatedCollection({
            fetchForward: FORWARD,
            fetchBackward: BACKWARD,
            recordsPerPage: 1,
            relayRoot: 'pagination',
          }),
        { wrapper },
      )

      await waitForNextUpdate()

      expect(result.current.hasNextPage).toEqual(true)
    })
  })
})
