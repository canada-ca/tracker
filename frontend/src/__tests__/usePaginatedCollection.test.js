import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { InMemoryCache, gql } from '@apollo/client'
import { MockedProvider } from '@apollo/client/testing'
import { usePaginatedCollection } from '../usePaginatedCollection'
import { renderHook } from '@testing-library/react-hooks'
import { relayStylePagination } from '@apollo/client/utilities'

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
        expect(queryByText(/repo two/)).toBeInTheDocument()
        expect(getAllByText(/repo two/)).toHaveLength(1)
      })

      const previous = getByRole('button', { name: /previous/ })

      fireEvent.click(previous)

      await waitFor(() => {
        expect(queryByText(/repo one/)).toBeInTheDocument()
        expect(getAllByText(/repo one/)).toHaveLength(1)
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
          }),
        { wrapper },
      )

      await waitForNextUpdate()

      expect(result.current.hasNextPage).toEqual(true)
    })
  })
})
