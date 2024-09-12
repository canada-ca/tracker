import React, { useCallback, useState } from 'react'
import { Trans, t } from '@lingui/macro'
import { Box, Divider, Text } from '@chakra-ui/react'
import { ErrorBoundary } from 'react-error-boundary'
import { string } from 'prop-types'

import { ListOf } from '../components/ListOf'
import { UserCard } from '../components/UserCard'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { PAGINATED_ORG_AFFILIATIONS as FORWARD } from '../graphql/queries'
import { SearchBox } from '../components/SearchBox'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'

export function OrganizationAffiliations({ orgSlug }) {
  const [usersPerPage, setUsersPerPage] = useState(10)
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('PERMISSION')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const {
    loading,
    isLoadingMore,
    error,
    nodes,
    next,
    previous,
    hasNextPage,
    hasPreviousPage,
    resetToFirstPage,
    totalCount,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    variables: {
      slug: orgSlug,
      orderBy: { direction: orderDirection, field: orderField },
      search: debouncedSearchTerm,
    },
    recordsPerPage: usersPerPage,
    relayRoot: 'findOrganizationBySlug.affiliations',
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
  })

  const orderByOptions = [
    { value: 'PERMISSION', text: t`Role` },
    { value: 'USERNAME', text: t`Email` },
    { value: 'DISPLAY_NAME', text: t`Name` },
  ]

  if (error) return <ErrorFallbackMessage error={error} />

  let userlist = loading ? (
    <LoadingMessage />
  ) : (
    <ListOf
      elements={nodes}
      ifEmpty={() => (
        <Text layerStyle="loadingMessage">
          <Trans>No Users</Trans>
        </Text>
      )}
      mb="4"
    >
      {({ permission, user }, index) => (
        <ErrorBoundary FallbackComponent={ErrorFallbackMessage} key={`${user.id}:${index}`}>
          <UserCard userName={user.userName} displayName={user.displayName} role={permission} />
          <Divider borderColor="gray.900" />
        </ErrorBoundary>
      )}
    </ListOf>
  )

  return (
    <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
      <Box>
        <SearchBox
          selectedDisplayLimit={usersPerPage}
          setSelectedDisplayLimit={setUsersPerPage}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          next={next}
          previous={previous}
          isLoadingMore={isLoadingMore}
          orderDirection={orderDirection}
          setSearchTerm={setSearchTerm}
          setOrderField={setOrderField}
          setOrderDirection={setOrderDirection}
          resetToFirstPage={resetToFirstPage}
          orderByOptions={orderByOptions}
          placeholder={t`Search for a user by email`}
          totalRecords={totalCount}
        />
        {userlist}
        <RelayPaginationControls
          onlyPagination={false}
          selectedDisplayLimit={usersPerPage}
          setSelectedDisplayLimit={setUsersPerPage}
          displayLimitOptions={[5, 10, 20, 50, 100]}
          resetToFirstPage={resetToFirstPage}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          next={next}
          previous={previous}
          isLoadingMore={isLoadingMore}
          totalRecords={totalCount}
        />
      </Box>
    </ErrorBoundary>
  )
}

OrganizationAffiliations.propTypes = { orgSlug: string }
