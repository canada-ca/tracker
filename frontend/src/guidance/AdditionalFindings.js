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
  Code,
  Divider,
  Flex,
  HStack,
  Stack,
  Table,
  TableContainer,
  Text,
  Tbody,
  Td,
  Tr,
  useToast,
} from '@chakra-ui/react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { string } from 'prop-types'

import { GUIDANCE_ADDITIONAL_FINDINGS } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'

export function AdditionalFindings({ domain }) {
  const toast = useToast()
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

  const activeOrderByOption = orderByOptions.find(({ value }) => value === orderField)?.text || t`Last seen`

  const toggleOrderDirection = () => {
    setOrderDirection((current) => (current === 'DESC' ? 'ASC' : 'DESC'))
    resetToFirstPage()
  }

  const cycleOrderField = () => {
    const currentIndex = orderByOptions.findIndex(({ value }) => value === orderField)
    const nextIndex = currentIndex === orderByOptions.length - 1 ? 0 : currentIndex + 1
    setOrderField(orderByOptions[nextIndex].value)
    resetToFirstPage()
  }

  const setSourceFilter = (source) => {
    setFilters([{ filterCategory: 'source', comparison: '==', filterValue: source }])
    resetToFirstPage()
  }

  const clearFilters = () => {
    setFilters([])
    resetToFirstPage()
  }

  const copyText = async (value, message) => {
    try {
      await navigator.clipboard.writeText(value)
      toast({
        title: message,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-left',
      })
    } catch {
      toast({
        title: t`Unable to copy value.`,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-left',
      })
    }
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
                normalizedValue = JSON.stringify(value)
              }

              return (
                <Tr key={key}>
                  <Td width="38%" fontWeight="semibold" fontSize="xs" whiteSpace="nowrap" pr="2">
                    {key}
                  </Td>
                  <Td fontSize="xs" whiteSpace="normal" wordBreak="break-word">
                    {String(normalizedValue)}
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

  if (findings.length === 0) {
    return (
      <Box borderWidth="1px" borderColor="black" justifyContent="center" rounded="md">
        <Text fontSize="2xl" fontWeight="bold" textAlign="center" my="1">
          <Trans>No additional findings available at this time.</Trans>
        </Text>
      </Box>
    )
  }

  return (
    <Box>
      <Flex gap="2" justifyContent="space-between" alignItems="center" mb="3" wrap="wrap">
        <HStack spacing="3" wrap="wrap">
          <Button variant="link" size="sm" onClick={cycleOrderField}>
            {t`Sort by`} {activeOrderByOption}
          </Button>
          <Button variant="link" size="sm" onClick={toggleOrderDirection}>
            {orderDirection === 'DESC' ? t`Descending` : t`Ascending`}
          </Button>
          {filters.length > 0 && (
            <Button variant="link" size="sm" onClick={clearFilters}>
              <Trans>Clear filters</Trans>
            </Button>
          )}
        </HStack>
      </Flex>

      <Accordion allowMultiple defaultIndex={[]}>
        {findings.map((finding, index) => {
          const rawValue = finding.raw ? JSON.stringify(finding.raw, null, 2) : ''
          const evidenceValue = finding.evidence ? JSON.stringify(finding.evidence, null, 2) : ''
          const attributesValue = finding.attributes ? JSON.stringify(finding.attributes, null, 2) : ''

          return (
            <AccordionItem
              key={`${finding.source || 'source'}:${finding.reasonCode || 'reason'}:${index}`}
              mb="3"
              borderWidth="1px"
              borderColor="gray.300"
              borderRadius="md"
              overflow="hidden"
            >
              <AccordionButton _expanded={{ bg: 'gray.100' }} alignItems="flex-start" py="3">
                <Box flex="1" textAlign="left">
                  <Flex justify="space-between" align="center" mb="2" wrap="wrap" gap="2">
                    <Text fontWeight="bold">{finding.findingType || t`Unknown finding`}</Text>
                    <HStack spacing="2" wrap="wrap">
                      <Badge colorScheme="red">{finding.severity || t`unknown severity`}</Badge>
                      <Badge colorScheme="blue">{finding.confidence || t`unknown confidence`}</Badge>
                      <Badge colorScheme="gray">{finding.status || t`unknown status`}</Badge>
                    </HStack>
                  </Flex>
                  <Text color="gray.700" mb="1">
                    <Trans>Source:</Trans> {finding.source || '-'}
                  </Text>
                  <Text color="gray.700" mb="1">
                    <Trans>Subject:</Trans> {finding.subject || '-'}
                  </Text>
                  <Text color="gray.700">
                    <Trans>First seen:</Trans> {finding.firstSeen || '-'} | <Trans>Last seen:</Trans>{' '}
                    {finding.lastSeen || '-'}
                  </Text>
                </Box>
                <AccordionIcon boxSize="icons.lg" mt="1" />
              </AccordionButton>

              <AccordionPanel bg="gray.50">
                <Stack spacing="3">
                  <Text>
                    <Trans>Reason code:</Trans> {finding.reasonCode || '-'}
                  </Text>
                  <Text>
                    <Trans>Occurrence count:</Trans> {finding.occurenceCount ?? '-'}
                  </Text>

                  <HStack spacing="2" flexWrap="wrap">
                    {finding.source && (
                      <Button size="sm" variant="primaryOutline" onClick={() => setSourceFilter(finding.source)}>
                        <Trans>Filter by source</Trans>
                      </Button>
                    )}
                    {finding.reasonCode && (
                      <Button
                        size="sm"
                        variant="primaryOutline"
                        onClick={() => copyText(finding.reasonCode, t`Reason code copied.`)}
                      >
                        <Trans>Copy reason code</Trans>
                      </Button>
                    )}
                  </HStack>

                  {attributesValue && (
                    <Box>
                      <Text fontWeight="bold" mb="1">
                        <Trans>Attributes</Trans>
                      </Text>
                      {renderKeyValueTable(finding.attributes)}
                    </Box>
                  )}

                  {evidenceValue && (
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
