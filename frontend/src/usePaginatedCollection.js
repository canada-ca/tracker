import { useCallback, useState } from 'react'
import { useQuery } from '@apollo/client'
import { setQueryAlias } from './setQueryAlias'
import { indexes } from './indexes'

export function usePaginatedCollection({
  recordsPerPage = 10,
  fetchForward,
  fetchBackward,
  fetchHeaders = {},
  variables,
  relayRoot,
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
    variables: { first: recordsPerPage, ...variables },
    context: {
      headers: fetchHeaders,
    },
  })

  let currentEdges
  let currentPageInfo

  if (data?.pagination !== undefined && relayRoot) {
    currentEdges = relayRoot.split('.').reduce((acc, cur) => {
      return acc[cur]
    }, data?.pagination)
    currentEdges = currentEdges?.edges || []
    currentPageInfo = currentEdges?.pageInfo || {}
  } else {
    currentEdges = data?.pagination?.edges || []
    currentPageInfo = data?.pagination?.pageInfo || {}
  }

  if (currentEdges?.length > recordsPerPage) {
    currentEdges = currentEdges.slice(
      ...indexes({
        page: currentPage,
        recordsPerPage,
      }),
    )
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
          after: data && data.pagination ? currentPageInfo.endCursor : '',
          ...variables,
        },
      })
    },
    previous: () => {
      setCurrentPage(currentPage > 2 ? currentPage - 1 : 1)
      return fetchMore({
        query: bkwrdQuery,
        variables: {
          last: recordsPerPage,
          before: data ? currentPageInfo.endCursor : '',
          ...variables,
        },
      })
    },
    hasPreviousPage: data ? currentPageInfo.hasPreviousPage : false,
    hasNextPage: data ? currentPageInfo.hasNextPage : false,
  }
}
