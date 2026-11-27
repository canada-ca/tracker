import React, { useState } from 'react'
import { Box, Flex, IconButton, ListItem, Select, Text } from '@chakra-ui/react'
import { ArrowDownIcon, ArrowUpIcon } from '@chakra-ui/icons'
import { useLingui, Trans } from '@lingui/react/macro'
import { string } from 'prop-types'

import { DOMAIN_ADDITIONAL_FINDINGS } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { ListOf } from '../components/ListOf'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { FindingCard } from './FindingCard'

export function AdditionalFindingsList({ domain }) {
  const { t } = useLingui()
  const [findingsPerPage, setFindingsPerPage] = useState(10)
  const [field, setField] = useState('LAST_SEEN')
  const [direction, setDirection] = useState('DESC')

  const {
    loading,
    isLoadingMore,
    error,
    nodes,
    totalCount,
    next,
    previous,
    resetToFirstPage,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: DOMAIN_ADDITIONAL_FINDINGS,
    recordsPerPage: findingsPerPage,
    relayRoot: 'findDomainByDomain.additionalFindings',
    variables: { domain, orderBy: { field, direction } },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'all',
  })

  const fieldLabels = {
    LAST_SEEN: t`Last seen`,
    FIRST_SEEN: t`First seen`,
    CONFIDENCE: t`Confidence`,
  }

  if (nodes.length === 0 && loading) {
    return (
      <LoadingMessage>
        <Trans>Additional Findings</Trans>
      </LoadingMessage>
    )
  }

  if (nodes.length === 0 && error) return <ErrorFallbackMessage error={error} />

  return (
    <Box>
      <Flex align="center" wrap="wrap" mb="4" gap="2">
        <Select
          borderWidth="1px"
          borderColor="black"
          w="auto"
          ml="auto"
          aria-label={t`Order by`}
          value={field}
          onChange={(e) => {
            setField(e.target.value)
            resetToFirstPage()
          }}
        >
          {Object.entries(fieldLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <IconButton
          variant="primaryOutline"
          aria-label={direction === 'DESC' ? t`Descending` : t`Ascending`}
          icon={direction === 'DESC' ? <ArrowDownIcon /> : <ArrowUpIcon />}
          onClick={() => {
            setDirection(direction === 'DESC' ? 'ASC' : 'DESC')
            resetToFirstPage()
          }}
        />
      </Flex>
      <ListOf
        elements={nodes}
        ifEmpty={() => (
          <Text fontWeight="bold" textAlign="center">
            <Trans>No additional findings for this domain.</Trans>
          </Text>
        )}
      >
        {(node) => (
          <ListItem key={node.id} mb="3">
            <FindingCard {...node} />
          </ListItem>
        )}
      </ListOf>
      <RelayPaginationControls
        onlyPagination={false}
        selectedDisplayLimit={findingsPerPage}
        setSelectedDisplayLimit={setFindingsPerPage}
        displayLimitOptions={[5, 10, 20, 50, 100]}
        resetToFirstPage={resetToFirstPage}
        totalRecords={totalCount}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
        mt="4"
      />
    </Box>
  )
}

AdditionalFindingsList.propTypes = { domain: string.isRequired }
