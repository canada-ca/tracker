import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { setQueryAlias } from './setQueryAlias'
import { indexes } from './indexes'

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

  const [currentPage, setCurrentPage] = useState(1)

  const { loading, error, data, fetchMore } = useQuery(fwdQuery, {
    variables: { first: recordsPerPage },
    context: {
      headers: fetchHeaders,
    },
  })

  let currentEdges

  if (data?.pagination?.edges?.length > recordsPerPage) {
    currentEdges = data.pagination.edges.slice(
      ...indexes({
        page: currentPage,
        recordsPerPage,
      }),
    )
  } else {
    currentEdges = data?.pagination?.edges
  }

  return {
    loading,
    error,
    edges: currentEdges,
    nodes: currentEdges?.map((e) => e.node),
    next: () => {
      setCurrentPage(currentPage + 1)
      return fetchMore({
        variables: {
          first: recordsPerPage,
          after:
            data && data.pagination ? data.pagination.pageInfo.endCursor : '',
        },
      })
    },
    previous: () => {
      setCurrentPage(currentPage > 2 ? currentPage - 1 : 1)
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
