import { Box, Text } from '@chakra-ui/react'
import React, { useCallback, useState } from 'react'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react'

import { AUDIT_LOGS } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { string } from 'prop-types'
import { t, Trans } from '@lingui/macro'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { SearchBox } from '../components/SearchBox'
import { RelayPaginationControls } from '../components/RelayPaginationControls'

export function AuditLogTable({ orgId = null }) {
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('TIMESTAMP')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [logsPerPage, setLogsPerPage] = useState(10)
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
    resetToFirstPage,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: AUDIT_LOGS,
    recordsPerPage: logsPerPage,
    relayRoot: 'findAuditLogs',
    variables: {
      orgId,
      orderBy: { field: orderField, direction: orderDirection },
      search: debouncedSearchTerm,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'ignore', // allow partial success
  })

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  const orderByOptions = [{ value: 'TIMESTAMP', text: t`Timestamp` }]

  let logTable
  if (loading || isLoadingMore) {
    logTable = (
      <LoadingMessage>
        <Trans>User List</Trans>
      </LoadingMessage>
    )
  } else if (nodes.length === 0) {
    logTable = (
      <Text layerStyle="loadingMessage">
        <Trans>No activity logs</Trans>
      </Text>
    )
  } else {
    logTable = (
      <TableContainer>
        <Table>
          <Thead>
            <Tr>
              <Th>Time Generated</Th>
              <Th>Initiated By</Th>
              <Th>Action</Th>
              <Th>Resource Type</Th>
              <Th>Resource Name</Th>
              <Th>Organization</Th>
              <Th>Reason</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {nodes.map(
              ({
                id,
                timestamp,
                initiatedBy,
                action,
                target,
                reason,
                status,
              }) => {
                return (
                  <Tr key={id}>
                    <Td>{timestamp}</Td>
                    <Td>{initiatedBy.userName}</Td>
                    <Td>{action.toUpperCase()}</Td>
                    <Td>{target.resourceType.toUpperCase()}</Td>
                    <Td>{target.resource}</Td>
                    <Td>{target.organization.name}</Td>
                    <Td>{reason}</Td>
                    <Td>{status.toUpperCase()}</Td>
                  </Tr>
                )
              },
            )}
          </Tbody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <Box>
      <SearchBox
        selectedDisplayLimit={logsPerPage}
        setSelectedDisplayLimit={setLogsPerPage}
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
        placeholder={t`Search for an activity`}
      />
      {logTable}
      <RelayPaginationControls
        onlyPagination={false}
        selectedDisplayLimit={logsPerPage}
        setSelectedDisplayLimit={setLogsPerPage}
        displayLimitOptions={[5, 10, 20, 50, 100]}
        resetToFirstPage={resetToFirstPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
      />
    </Box>
  )
}

AuditLogTable.propTypes = {
  orgId: string,
}
