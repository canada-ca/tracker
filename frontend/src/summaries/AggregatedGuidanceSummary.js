import React, { useState } from 'react'
import { Accordion, Box, Text } from '@chakra-ui/react'
import { string } from 'prop-types'
import { ORG_NEGATIVE_FINDINGS } from '../graphql/queries'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { LoadingMessage } from '../components/LoadingMessage'
import { ListOf } from '../components/ListOf'
import { Trans } from '@lingui/macro'
import { ErrorBoundary } from 'react-error-boundary'
import { GuidanceTagDetails } from '../guidance/GuidanceTagDetails'
import { useQuery } from '@apollo/client'

export function AggregatedGuidanceSummary({ orgSlug, ...props }) {
  const [tagsPerPage, setTagsPerPage] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const { loading, error, data } = useQuery(ORG_NEGATIVE_FINDINGS, { variables: { orgSlug } })

  if (error) return <ErrorFallbackMessage error={error} />

  const handleNext = () => {
    setCurrentPage(currentPage + 1)
  }

  const handlePrevious = () => {
    setCurrentPage(currentPage - 1)
  }

  const resetToFirstPage = () => {
    setCurrentPage(1)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setTagsPerPage(newItemsPerPage)
  }

  const paginatedData = data?.findOrganizationBySlug?.summaries?.negativeFindings?.guidanceTags.slice(
    (currentPage - 1) * tagsPerPage,
    currentPage * tagsPerPage,
  )

  let tagList = loading ? (
    <LoadingMessage />
  ) : (
    <Accordion>
      <ListOf
        elements={paginatedData}
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
      {tagList}
      <RelayPaginationControls
        currentPage={currentPage}
        itemsPerPage={tagsPerPage}
        totalRecords={data?.findOrganizationBySlug?.summaries?.negativeFindings?.totalCount || 0}
        next={handleNext}
        hasNextPage={currentPage < data?.findOrganizationBySlug?.summaries?.negativeFindings?.totalCount / tagsPerPage}
        hasPreviousPage={currentPage > 1}
        previous={handlePrevious}
        setSelectedDisplayLimit={handleItemsPerPageChange}
        resetToFirstPage={resetToFirstPage}
        displayLimitOptions={[5, 10, 20]}
      />
    </Box>
  )
}

AggregatedGuidanceSummary.propTypes = {
  orgSlug: string.isRequired,
}
