import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { indexes } from './indexes'

export function usePaginatedCollection({
  recordsPerPage = 10,
  fetchForward,
  fetchHeaders = {},
  variables,
  resettingVariables,
  relayRoot,
}) {
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [resettingVariables])

  const { loading, error, data, fetchMore } = useQuery(fetchForward, {
    variables: { first: recordsPerPage, ...variables },
    context: {
      headers: fetchHeaders,
    },
  })

  let currentEdges = []
  let currentPageInfo = {}

  if (data) {
    currentEdges = relayRoot.split('.').reduce((acc, cur) => {
      return acc[cur]
    }, data)
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
    error,
    edges: currentEdges,
    nodes: currentEdges?.map((e) => e.node),
    currentPage,
    setCurrentPage,
    next: async () => {
      if (currentPage === totalPages) {
        await fetchMore({
          variables: {
            ...variables,
            first: recordsPerPage,
            after: currentPageInfo.endCursor,
          },
        })
      }
      setCurrentPage(currentPage + 1)
    },
    previous: () => {
      setCurrentPage(currentPage > 2 ? currentPage - 1 : 1)
    },
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPageInfo?.hasNextPage || currentPage < totalPages,
  }
}
