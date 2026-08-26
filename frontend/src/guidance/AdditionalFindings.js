import React, { useState } from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Select,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Table,
  TableContainer,
  Text,
  Tbody,
  Td,
  Tr,
} from '@chakra-ui/react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { string } from 'prop-types'

import { ArrowDownIcon, ArrowUpIcon } from '@chakra-ui/icons'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { GUIDANCE_ADDITIONAL_FINDINGS } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'

const severityColorMap = {
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'green',
  info: 'blue',
}

const confidenceColorMap = {
  high: 'green',
  medium: 'yellow',
  low: 'gray',
}

const statusColorMap = {
  active: 'red',
  open: 'red',
  in_progress: 'orange',
  monitoring: 'yellow',
  resolved: 'green',
  closed: 'green',
  dismissed: 'gray',
}

const buildFindingKey = (finding) => {
  const keyParts = [
    finding.source,
    finding.reasonCode,
    finding.subject,
    finding.firstSeen,
    finding.findingType,
    finding.lastSeen,
    finding.severity,
    finding.confidence,
    finding.status,
  ]

  return keyParts
    .map((keyPart) => {
      const keyText = keyPart === null || keyPart === undefined || keyPart === '' ? '-' : String(keyPart)
      return keyText.trim().toLowerCase()
    })
    .join('|')
}

const getBadgeColor = (value, colorMap) => {
  const normalizedValue = (value === null || value === undefined || value === '' ? '-' : String(value))
    .trim()
    .toLowerCase()

  return colorMap[normalizedValue] || 'gray'
}

const formatSeenDate = (value) => {
  if (!value) return '-'

  const dateValue = new Date(value)

  if (Number.isNaN(dateValue.getTime())) {
    return String(value)
  }

  return dateValue.toLocaleString()
}

export function AdditionalFindings({ domain }) {
  const [findingsPerPage, setFindingsPerPage] = useState(10)
  const [orderDirection, setOrderDirection] = useState('DESC')
  const [orderField, setOrderField] = useState('LAST_SEEN')
  const [filters, setFilters] = useState([])

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
    fetchForward: GUIDANCE_ADDITIONAL_FINDINGS,
    recordsPerPage: findingsPerPage,
    relayRoot: 'findDomainByDomain.additionalFindings',
    variables: {
      domain,
      limit: findingsPerPage,
      filters,
      orderBy: {
        field: orderField,
        direction: orderDirection,
      },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  })

  const findings = nodes || []

  const orderByOptions = [
    { value: 'LAST_SEEN', text: t`Last seen` },
    { value: 'FIRST_SEEN', text: t`First seen` },
    { value: 'SEVERITY', text: t`Severity` },
    { value: 'CONFIDENCE', text: t`Confidence` },
    { value: 'SOURCE', text: t`Source` },
  ]

  const toggleOrderDirection = () => {
    setOrderDirection((current) => (current === 'DESC' ? 'ASC' : 'DESC'))
    resetToFirstPage()
  }

  const handleOrderFieldChange = (event) => {
    setOrderField(event.target.value)
    resetToFirstPage()
  }

  const addSourceFilter = (source) => {
    if (!source) return

    setFilters((currentFilters) => {
      const hasSameFilter = currentFilters.some(
        ({ filterCategory, comparison, filterValue }) =>
          filterCategory === 'source' && comparison === '==' && filterValue === source,
      )

      if (hasSameFilter) {
        return currentFilters
      }

      return [...currentFilters, { filterCategory: 'source', comparison: '==', filterValue: source }]
    })
    resetToFirstPage()
  }

  const clearFilters = () => {
    setFilters([])
    resetToFirstPage()
  }

  const removeFilter = (filterToRemove) => {
    setFilters((currentFilters) =>
      currentFilters.filter(
        (activeFilter) =>
          !(
            activeFilter.filterCategory === filterToRemove.filterCategory &&
            activeFilter.comparison === filterToRemove.comparison &&
            activeFilter.filterValue === filterToRemove.filterValue
          ),
      ),
    )
    resetToFirstPage()
  }

  const renderKeyValueTable = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return (
        <Text fontSize="sm" color="gray.700">
          -
        </Text>
      )
    }

    const entries = Object.entries(data)

    if (entries.length === 0) {
      return (
        <Text fontSize="sm" color="gray.700">
          -
        </Text>
      )
    }

    return (
      <TableContainer
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        bg="white"
        maxW="100%"
        overflowX="auto"
      >
        <Table size="xs" variant="simple" sx={{ tableLayout: 'fixed' }}>
          <Tbody>
            {entries.map(([key, value]) => {
              let normalizedValue = value

              if (typeof value === 'object' && value !== null) {
                normalizedValue = JSON.stringify(value, null, 2)
              }

              const valueText =
                normalizedValue === null || normalizedValue === undefined || normalizedValue === ''
                  ? '-'
                  : String(normalizedValue)

              return (
                <Tr key={key}>
                  <Td width="38%" fontWeight="semibold" fontSize="xs" whiteSpace="nowrap" p="2">
                    {key}
                  </Td>
                  <Td fontSize="xs" whiteSpace="normal" wordBreak="break-word">
                    <Flex
                      bg="gray.100"
                      borderRadius="sm"
                      px="2"
                      py="1"
                      maxH="7.5rem"
                      overflowY="auto"
                      fontFamily="mono"
                      whiteSpace="pre-wrap"
                    >
                      {valueText}
                    </Flex>
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </TableContainer>
    )
  }

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Additional Findings</Trans>
      </LoadingMessage>
    )
  }

  if (findings.length === 0 && filters.length === 0) {
    return (
      <Box borderWidth="1px" borderColor="gray.200" bg="gray.50" px="6" py="8" rounded="md">
        <Text fontSize="xl" fontWeight="semibold" textAlign="center" color="gray.700">
          <Trans>No additional findings are available right now.</Trans>
        </Text>
        <Text fontSize="sm" textAlign="center" color="gray.600" mt="2">
          <Trans>Try rerunning the scan for this domain later.</Trans>
        </Text>
      </Box>
    )
  }

  return (
    <Box w="100%">
      <Flex justifyContent="space-between" align="flex-start" gap="3" mb="3">
        {filters.length > 0 && (
          <HStack spacing="2" mb="4" wrap="wrap" align="center">
            {filters.map((activeFilter) => {
              return (
                <Tag
                  key={`${activeFilter.filterCategory}:${activeFilter.comparison}:${activeFilter.filterValue}`}
                  size="md"
                  borderRadius="full"
                  variant="subtle"
                  colorScheme="blue"
                >
                  <TagLabel>
                    <Trans>Source:</Trans> {activeFilter.filterValue}
                  </TagLabel>
                  <TagCloseButton onClick={() => removeFilter(activeFilter)} aria-label={t`Remove source filter`} />
                </Tag>
              )
            })}
            <Button variant="link" size="sm" onClick={clearFilters}>
              <Trans>Clear all</Trans>
            </Button>
          </HStack>
        )}
        <HStack spacing="3" align="center" justify="flex-end" ml="auto">
          <Flex align="center" gap="2">
            <Text fontSize="sm" color="gray.700" fontWeight="bold" whiteSpace="nowrap">
              <Trans>Sort by:</Trans>
            </Text>
            <Select
              size="sm"
              value={orderField}
              onChange={handleOrderFieldChange}
              aria-label={t`Select sorting field`}
              borderColor="gray.900"
              bg="white"
              maxW="14rem"
              borderWidth="1px"
            >
              {orderByOptions.map(({ value, text }) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </Select>
          </Flex>
          <Button
            size="sm"
            borderColor="gray.900"
            borderWidth="1px"
            variant="outline"
            onClick={toggleOrderDirection}
            aria-pressed={orderDirection === 'DESC'}
            aria-label={
              orderDirection === 'DESC'
                ? t`Sorting descending, activate for ascending`
                : t`Sorting ascending, activate for descending`
            }
          >
            {orderDirection === 'DESC' ? <ArrowDownIcon boxSize="icons.md" /> : <ArrowUpIcon boxSize="icons.md" />}
          </Button>
        </HStack>
      </Flex>

      {filters.length > 0 && findings.length === 0 && (
        <Box borderWidth="1px" borderColor="gray.200" bg="gray.50" px="6" py="7" rounded="md" mb="4">
          <Text fontSize="lg" fontWeight="semibold" textAlign="center" color="gray.700">
            <Trans>No findings match your current filters.</Trans>
          </Text>
          <Text fontSize="sm" textAlign="center" color="gray.600" mt="2">
            <Trans>Try removing one or more filters to see additional findings.</Trans>
          </Text>
          <Flex justifyContent="center" mt="3">
            <Button size="sm" onClick={clearFilters}>
              <Trans>Clear all filters</Trans>
            </Button>
          </Flex>
        </Box>
      )}

      <Accordion allowMultiple defaultIndex={[]}>
        {findings.map((finding) => {
          const occurrenceCount = finding.occurrenceCount ?? '-'

          return (
            <AccordionItem
              key={buildFindingKey(finding)}
              mb="3"
              borderWidth="1px"
              borderColor="gray.300"
              borderRadius="md"
              overflow="hidden"
            >
              <AccordionButton _expanded={{ bg: 'gray.100' }} alignItems="flex-start" py="3">
                <Box flex="1" textAlign="left">
                  <Flex justify="space-between" align="flex-start" mb="2" wrap="wrap" gap="2">
                    <Text fontWeight="bold" fontSize="md" lineHeight="short">
                      {finding.findingType || t`Unknown finding`}
                    </Text>
                    <HStack spacing="2" align="center" wrap="wrap">
                      <HStack as="span" spacing="1" align="center">
                        <Text as="span" fontSize="xs" color="gray.700" fontWeight="bold">
                          <Trans>Severity</Trans>
                        </Text>
                        <Badge colorScheme={getBadgeColor(finding.severity, severityColorMap)}>
                          {finding.severity || t`unknown severity`}
                        </Badge>
                      </HStack>
                      <HStack as="span" spacing="1" align="center">
                        <Text as="span" fontSize="xs" color="gray.700" fontWeight="bold">
                          <Trans>Confidence</Trans>
                        </Text>
                        <Badge colorScheme={getBadgeColor(finding.confidence, confidenceColorMap)}>
                          {finding.confidence || t`unknown confidence`}
                        </Badge>
                      </HStack>
                      <HStack as="span" spacing="1" align="center">
                        <Text as="span" fontSize="xs" color="gray.700" fontWeight="bold">
                          <Trans>Status</Trans>
                        </Text>
                        <Badge colorScheme={getBadgeColor(finding.status, statusColorMap)}>
                          {finding.status || t`unknown status`}
                        </Badge>
                      </HStack>
                      <AccordionIcon boxSize="icons.lg" mt="1" />
                    </HStack>
                  </Flex>
                  <Text color="gray.700" fontSize="sm" mb="1">
                    <Trans>Source:</Trans>{' '}
                    {finding.source === null || finding.source === undefined || finding.source === ''
                      ? '-'
                      : String(finding.source)}{' '}
                    • <Trans>Subject:</Trans>{' '}
                    {finding.subject === null || finding.subject === undefined || finding.subject === ''
                      ? '-'
                      : String(finding.subject)}
                  </Text>
                  <Text color="gray.700" fontSize="sm">
                    <Trans>First seen:</Trans> {formatSeenDate(finding.firstSeen)} • <Trans>Last seen:</Trans>{' '}
                    {formatSeenDate(finding.lastSeen)}
                  </Text>
                </Box>
              </AccordionButton>

              <AccordionPanel bg="gray.50">
                <Stack spacing="3">
                  <Text fontSize="sm">
                    <Trans>Occurrence count:</Trans> {occurrenceCount}
                  </Text>
                  {finding.source && (
                    <Button
                      size="sm"
                      variant="primaryOutline"
                      onClick={() => addSourceFilter(finding.source)}
                      aria-label={t`Filter findings by this source`}
                    >
                      <Trans>Filter by source</Trans>
                    </Button>
                  )}
                  {finding.attributes && (
                    <Box>
                      <Text fontWeight="bold" mb="1">
                        <Trans>Attributes</Trans>
                      </Text>
                      {renderKeyValueTable(finding.attributes)}
                    </Box>
                  )}
                  {finding.evidence && (
                    <Box>
                      <Text fontWeight="bold" mb="1">
                        <Trans>Evidence</Trans>
                      </Text>
                      {renderKeyValueTable(finding.evidence)}
                    </Box>
                  )}
                  <Divider borderColor="gray.300" />
                </Stack>
              </AccordionPanel>
            </AccordionItem>
          )
        })}
      </Accordion>

      <RelayPaginationControls
        onlyPagination={false}
        selectedDisplayLimit={findingsPerPage}
        setSelectedDisplayLimit={setFindingsPerPage}
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

AdditionalFindings.propTypes = {
  domain: string.isRequired,
}
