import { Button, Select, Flex, Text } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import React from 'react'
import { array, bool, func, number } from 'prop-types'

export function RelayPaginationControls({
  previous,
  hasPreviousPage,
  next,
  hasNextPage,
  resetToFirstPage,
  selectedDisplayLimit,
  setSelectedDisplayLimit,
  displayLimitOptions,
  onlyPagination,
  isLoadingMore,
  ...props
}) {
  let displayLimitControls = ''
  if (!onlyPagination) {
    const options = displayLimitOptions.map((limit) => {
      return (
        <option value={limit} key={`option-${limit}`}>
          {limit}
        </option>
      )
    })

    displayLimitControls = (
      <>
        <Text mr={'1%'} ml="auto">
          <Trans>Items per page:</Trans>
        </Text>

        <Select
          aria-label="Items per page"
          isDisabled={isLoadingMore}
          value={selectedDisplayLimit}
          onChange={(e) => {
            setSelectedDisplayLimit(parseInt(e.target.value))
            resetToFirstPage() // Make sure to provide this as a prop if !onlyPagination
          }}
          width="fit-content"
          variant="filled"
        >
          {options}
        </Select>
      </>
    )
  }

  return (
    <Flex align="center" mb="4" {...props}>
      <Button
        id="previousPageBtn"
        onClick={previous}
        isDisabled={!hasPreviousPage}
        isLoading={isLoadingMore}
        aria-label="Previous page"
      >
        <Trans>Previous</Trans>
      </Button>

      <Button
        id="nextPageBtn"
        onClick={next}
        isDisabled={!hasNextPage}
        isLoading={isLoadingMore}
        aria-label="Next page"
      >
        <Trans>Next</Trans>
      </Button>
      {displayLimitControls}
    </Flex>
  )
}

RelayPaginationControls.propTypes = {
  previous: func,
  hasPreviousPage: bool,
  next: func,
  hasNextPage: bool,
  resetToFirstPage: func,
  selectedDisplayLimit: number,
  setSelectedDisplayLimit: func,
  displayLimitOptions: array,
  onlyPagination: bool,
  isLoadingMore: bool,
}
