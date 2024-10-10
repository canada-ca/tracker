import { Accordion, Box, Heading, Text } from '@chakra-ui/react'
import { string } from 'prop-types'
import React, { useState } from 'react'
import { ORG_NEGATIVE_FINDINGS } from '../graphql/queries'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { LoadingMessage } from '../components/LoadingMessage'
import { ListOf } from '../components/ListOf'
import { Trans } from '@lingui/macro'
import { ErrorBoundary } from 'react-error-boundary'
import { GuidanceTagDetails } from '../guidance/GuidanceTagDetails'

export function AggregatedGuidanceSummary({ orgSlug, ...props }) {
  const [tagsPerPage, setTagsPerPage] = useState(5)
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
    fetchForward: ORG_NEGATIVE_FINDINGS,
    variables: { orgSlug },
    recordsPerPage: tagsPerPage,
    relayRoot: 'findOrganizationBySlug.summaries.negativeFindings',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  })

  if (error) return <ErrorFallbackMessage error={error} />

  let tagList = loading ? (
    <LoadingMessage />
  ) : (
    <Accordion>
      <ListOf
        elements={nodes}
        ifEmpty={() => (
          <Text layerStyle="loadingMessage">
            <Trans>No negative findings to show. </Trans>
          </Text>
        )}
        mb="4"
      >
        {(guidanceTag, index) => (
          <ErrorBoundary FallbackComponent={ErrorFallbackMessage} key={`${guidanceTag.tagId}:${index}`}>
            <Box key={guidanceTag + index} bg="weakMuted" mb="1" rounded="md" mx="2">
              <GuidanceTagDetails guidanceTag={guidanceTag} tagType="negative" />
            </Box>
          </ErrorBoundary>
        )}
      </ListOf>
    </Accordion>
  )

  return (
    <Box {...props}>
      <Heading size="md" mb="2">
        <Trans>Most Common Negative Findings</Trans>
      </Heading>
      {tagList}
      <RelayPaginationControls
        onlyPagination={false}
        selectedDisplayLimit={tagsPerPage}
        setSelectedDisplayLimit={setTagsPerPage}
        displayLimitOptions={[5, 10, 20]}
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

AggregatedGuidanceSummary.propTypes = {
  orgSlug: string.isRequired,
}
