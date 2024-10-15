import { useState } from 'react'
import { useQuery } from '@apollo/client'

import { indexes } from './indexes'

export function usePaginatedCollection({
  recordsPerPage,
  fetchForward,
  fetchHeaders = {},
  variables,
  relayRoot,
  ...rest
}) {
  const [currentPage, setCurrentPage] = useState(1)

  const { loading, error, data, fetchMore } = useQuery(fetchForward, {
    variables: { first: recordsPerPage, ...variables },
    context: {
      headers: fetchHeaders,
    },
    ...rest,
  })

  const [isLoadingMore, setIsLoadingMore] = useState(false)

  let currentEdges = []
  let currentPageInfo = {}
  let totalCount = 0

  if (data) {
    currentEdges = relayRoot.split('.').reduce((acc, cur) => {
      return acc[cur]
    }, data)
    totalCount = currentEdges?.totalCount || 0
    currentPageInfo = currentEdges?.pageInfo
    currentEdges = currentEdges?.edges || []
  }

  const totalPages = Math.ceil(currentEdges.length / recordsPerPage)

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
    isLoadingMore,
    error,
    edges: currentEdges,
    nodes: currentEdges?.map((e) => e.node),
    totalCount,
    setCurrentPage,
    next: async () => {
      if (currentPage === totalPages) {
        setIsLoadingMore(true)
        await fetchMore({
          variables: {
            ...variables,
            first: recordsPerPage,
            after: currentPageInfo.endCursor,
          },
        })
        setIsLoadingMore(false)
      }
      setCurrentPage(currentPage + 1)
    },
    previous: () => {
      setCurrentPage(currentPage > 2 ? currentPage - 1 : 1)
    },
    resetToFirstPage: () => {
      setCurrentPage(1)
    },
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPageInfo?.hasNextPage || currentPage < totalPages,
  }
}
