import { useQuery } from '@apollo/client'
import { setQueryAlias } from './setQueryAlias'

export function usePaginatedCollection({
  recordsPerPage = 10,
  fetchForward,
  fetchBackward,
  fetchHeaders = {},
}) {
  const { query: fwdQuery } = setQueryAlias({
    query: fetchForward,
    alias: 'pagination',
  })

  const { query: bkwrdQuery } = setQueryAlias({
    query: fetchBackward,
    alias: 'pagination',
  })

  const { loading, error, data, fetchMore } = useQuery(fwdQuery, {
    variables: { first: recordsPerPage },
    context: {
      headers: fetchHeaders,
    },
  })

  return {
    loading,
    error,
    edges: data ? data.pagination.edges : undefined,
    nodes: data ? data.pagination.edges.map((e) => e.node) : undefined,
    next: () => {
      return fetchMore({
        variables: {
          first: recordsPerPage,
          after:
            data && data.pagination ? data.pagination.pageInfo.endCursor : '',
        },
      })
    },
    previous: () => {
      return fetchMore({
        query: bkwrdQuery,
        variables: {
          last: recordsPerPage,
          before: data ? data.pagination?.pageInfo?.endCursor : '',
        },
      })
    },
    hasPreviousPage: data ? data.pagination?.pageInfo?.hasPreviousPage : false,
    hasNextPage: data ? data.pagination?.pageInfo?.hasNextPage : false,
  }
}
