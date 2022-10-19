import React, { useCallback, useState } from 'react'
import {
  Box,
  Grid,
  GridItem,
  Button,
  Divider,
  Tag,
  Text,
  SimpleGrid,
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
    { value: 'TIMESTAMP', text: t`Timestamp` },
    { value: 'INITIATED_BY', text: t`Initiated By` },
    { value: 'RESOURCE_NAME', text: t`Resource` },
    { value: 'STATUS', text: t`Status` },
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
      <TableContainer>
        <Table>
          <Thead>
            <Tr>
              <Th>
                <Trans>Time Generated</Trans>
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
                <Trans>Reason</Trans>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {nodes.map(
              ({ id, timestamp, initiatedBy, action, target, reason }) => {
                return (
                  <Tr key={id}>
                    <Td>{timestamp}</Td>
                    <Td>{initiatedBy.userName}</Td>
                    <Td>{action.toUpperCase()}</Td>
                    <Td>{target.resourceType.toUpperCase()}</Td>
                    <Td>{target.resource}</Td>
                    <Td>{target.organization.name}</Td>
                    <Td>{reason}</Td>
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
      <Grid templateColumns="repeat(5, 1fr)" gap={4}>
        <GridItem colSpan={4}>{logTable}</GridItem>
        <GridItem colStart={5} colEnd={6}>
          <Box h="auto" borderColor="gray.900" borderWidth="1px" rounded="md">
            <Text px="2" pt="2" fontWeight="bold">
              <Trans>Filter Tags</Trans>
            </Text>
            <Divider />
            <Box p="2">
              <Text fontWeight="bold">
                <Trans>Resource:</Trans>
              </Text>
              <SimpleGrid mb="2" columns={2} spacingX="2" spacingY="2">
                {resourceFilters.map(({ value, text }, idx) => {
                  return (
                    <Tag
                      key={idx}
                      borderRadius="full"
                      borderWidth="1px"
                      borderColor="gray.900"
                      bg={
                        activeResourceFilters.indexOf(value) < 0
                          ? 'gray.50'
                          : 'gray.900'
                      }
                      color={
                        activeResourceFilters.indexOf(value) < 0
                          ? 'gray.900'
                          : 'gray.50'
                      }
                      as="button"
                      _hover={
                        activeResourceFilters.indexOf(value) < 0
                          ? { bg: 'gray.200' }
                          : { bg: 'gray.500' }
                      }
                      onClick={() => {
                        let optionIdx = activeResourceFilters.indexOf(value)
                        if (optionIdx < 0) {
                          setActiveResourceFilters([
                            ...activeResourceFilters,
                            value,
                          ])
                        } else {
                          setActiveResourceFilters(
                            activeResourceFilters.filter(
                              (tag) => tag !== value,
                            ),
                          )
                        }
                      }}
                    >
                      <Text mx="auto">{text}</Text>
                    </Tag>
                  )
                })}
              </SimpleGrid>
              <Text fontWeight="bold">
                <Trans>Action:</Trans>
              </Text>
              <SimpleGrid columns={2} spacingX="2" spacingY="2">
                {actionFilters.map(({ value, text }, idx) => {
                  return (
                    <Tag
                      key={idx}
                      borderRadius="full"
                      borderWidth="1px"
                      borderColor="gray.900"
                      bg={
                        activeActionFilters.indexOf(value) < 0
                          ? 'gray.50'
                          : 'gray.900'
                      }
                      color={
                        activeActionFilters.indexOf(value) < 0
                          ? 'gray.900'
                          : 'gray.50'
                      }
                      as="button"
                      _hover={
                        activeActionFilters.indexOf(value) < 0
                          ? { bg: 'gray.200' }
                          : { bg: 'gray.500' }
                      }
                      onClick={() => {
                        let optionIdx = activeActionFilters.indexOf(value)
                        if (optionIdx < 0) {
                          setActiveActionFilters([
                            ...activeActionFilters,
                            value,
                          ])
                        } else {
                          setActiveActionFilters(
                            activeActionFilters.filter((tag) => tag !== value),
                          )
                        }
                      }}
                    >
                      <Text mx="auto">{text}</Text>
                    </Tag>
                  )
                })}
              </SimpleGrid>
              <Button
                mt="100%"
                variant="primaryOutline"
                onClick={() => {
                  setActiveResourceFilters([])
                  setActiveActionFilters([])
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </GridItem>
      </Grid>
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
