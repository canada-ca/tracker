import React, { useCallback, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  Tag,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Flex,
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
  const [orderDirection, setOrderDirection] = useState('DESC')
  const [orderField, setOrderField] = useState('TIMESTAMP')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [logsPerPage, setLogsPerPage] = useState(50)
  const [activeResourceFilters, setActiveResourceFilters] = useState([])
  const [activeActionFilters, setActiveActionFilters] = useState([])
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
    totalCount,
  } = usePaginatedCollection({
    fetchForward: AUDIT_LOGS,
    recordsPerPage: logsPerPage,
    relayRoot: 'findAuditLogs',
    variables: {
      orgId,
      orderBy: { field: orderField, direction: orderDirection },
      search: debouncedSearchTerm,
      filters: { resource: activeResourceFilters, action: activeActionFilters },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'ignore', // allow partial success
  })

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  const orderByOptions = [
    { value: 'TIMESTAMP', text: t`Time Generated` },
    { value: 'INITIATED_BY', text: t`Initiated By` },
    { value: 'RESOURCE_NAME', text: t`Resource Name` },
  ]

  const resourceFilters = [
    { value: 'DOMAIN', text: t`Domain` },
    { value: 'USER', text: t`User` },
    { value: 'ORGANIZATION', text: t`Organization` },
  ]
  const actionFilters = [
    { value: 'CREATE', text: t`Create` },
    { value: 'ADD', text: t`Add` },
    { value: 'UPDATE', text: t`Update` },
    { value: 'REMOVE', text: t`Remove` },
    { value: 'DELETE', text: t`Delete` },
    { value: 'EXPORT', text: t`Export` },
    { value: 'SCAN', text: t`Scan` },
  ]

  let logTable
  if (loading || isLoadingMore) {
    logTable = (
      <LoadingMessage>
        <Trans>Audit Logs</Trans>
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
      <TableContainer mb="2">
        <Table>
          <Thead>
            <Tr>
              <Th>
                <Trans>Time Generated (UTC)</Trans>
              </Th>
              <Th>
                <Trans>Initiated By</Trans>
              </Th>
              <Th>
                <Trans>Action</Trans>
              </Th>
              <Th>
                <Trans>Resource Type</Trans>
              </Th>
              <Th>
                <Trans>Resource Name</Trans>
              </Th>
              <Th>
                <Trans>Organization</Trans>
              </Th>
              <Th>
                <Trans>Updated Properties</Trans>
              </Th>
              <Th>
                <Trans>Reason</Trans>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {nodes.map(({ id, timestamp, initiatedBy, action, target, reason }) => {
              const formatTimestamp = (ts) => {
                const dateTime = ts.split('T')
                return dateTime[0] + ', ' + dateTime[1].substring(0, 5)
              }
              const resourceType = resourceFilters.find(({ value }) => target.resourceType.toUpperCase() === value)
              action = actionFilters.find(({ value }) => action?.toUpperCase() === value)
              if (reason === 'NONEXISTENT') {
                reason = <Trans>This domain no longer exists</Trans>
              } else if (reason === 'WRONG_ORG') {
                reason = <Trans>This domain does not belong to this organization</Trans>
              } else if (reason === 'INVESTMENT') {
                reason = <Trans>Organization is invested in the outside domain</Trans>
              } else if (reason === 'OWNERSHIP') {
                reason = <Trans>Organization owns this domain, but it is outside the allowed scope</Trans>
              } else if (reason === 'OTHER') {
                reason = <Trans>Other</Trans>
              }
              return (
                <Tr key={id}>
                  <Td>{formatTimestamp(timestamp)}</Td>
                  <Td>{initiatedBy?.userName}</Td>
                  <Td>{action?.text.toUpperCase()}</Td>
                  <Td>{resourceType?.text.toUpperCase()}</Td>
                  <Td>{target?.resource}</Td>
                  <Td>{target?.organization?.name}</Td>
                  <Td>
                    {target?.updatedProperties?.map(({ name, oldValue, newValue }) => {
                      return (
                        <Box key={name}>
                          <Flex>
                            <Trans>Name:</Trans> {name}
                          </Flex>
                          <Flex>
                            <Trans>Old Value:</Trans> {oldValue}
                          </Flex>
                          <Flex>
                            <Trans>New Value:</Trans> {newValue}
                          </Flex>
                          {target?.updatedProperties?.length > 1 && <Divider />}
                        </Box>
                      )
                    })}
                  </Td>
                  <Td>{reason}</Td>
                </Tr>
              )
            })}
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
        placeholder={t`Search by initiated by, resource name`}
        totalRecords={totalCount}
      />
      <Box h="auto" borderColor="gray.900" borderWidth="1px" rounded="md">
        <Flex>
          <Flex align="center">
            <Text fontWeight="bold" mx="2">
              <Trans>Resource:</Trans>
            </Text>
            {resourceFilters.map(({ value, text }, idx) => {
              return (
                <Tag
                  mx="1"
                  key={idx}
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="gray.900"
                  bg={activeResourceFilters.indexOf(value) < 0 ? 'gray.50' : 'gray.900'}
                  color={activeResourceFilters.indexOf(value) < 0 ? 'gray.900' : 'gray.50'}
                  as="button"
                  _hover={activeResourceFilters.indexOf(value) < 0 ? { bg: 'gray.200' } : { bg: 'gray.500' }}
                  onClick={() => {
                    let optionIdx = activeResourceFilters.indexOf(value)
                    if (optionIdx < 0) {
                      setActiveResourceFilters([...activeResourceFilters, value])
                    } else {
                      setActiveResourceFilters(activeResourceFilters.filter((tag) => tag !== value))
                    }
                    resetToFirstPage()
                  }}
                >
                  <Text mx="auto">{text}</Text>
                </Tag>
              )
            })}
          </Flex>

          <Flex align="center">
            <Text fontWeight="bold" mx="2">
              <Trans>Action:</Trans>
            </Text>
            {actionFilters.map(({ value, text }, idx) => {
              return (
                <Tag
                  mx="1"
                  key={idx}
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="gray.900"
                  bg={activeActionFilters.indexOf(value) < 0 ? 'gray.50' : 'gray.900'}
                  color={activeActionFilters.indexOf(value) < 0 ? 'gray.900' : 'gray.50'}
                  as="button"
                  _hover={activeActionFilters.indexOf(value) < 0 ? { bg: 'gray.200' } : { bg: 'gray.500' }}
                  onClick={() => {
                    let optionIdx = activeActionFilters.indexOf(value)
                    if (optionIdx < 0) {
                      setActiveActionFilters([...activeActionFilters, value])
                    } else {
                      setActiveActionFilters(activeActionFilters.filter((tag) => tag !== value))
                    }
                    resetToFirstPage()
                  }}
                >
                  <Text mx="auto">{text}</Text>
                </Tag>
              )
            })}
          </Flex>
          <Button
            ml="auto"
            my="2"
            mr="2"
            variant="primaryOutline"
            onClick={() => {
              setActiveResourceFilters([])
              setActiveActionFilters([])
              resetToFirstPage()
            }}
          >
            Clear
          </Button>
        </Flex>
      </Box>
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
        totalRecords={totalCount}
      />
    </Box>
  )
}

AuditLogTable.propTypes = {
  orgId: string,
}
