import { Select, Flex, Text, IconButton, Divider } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import React from 'react'
import { array, bool, func, number } from 'prop-types'
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'

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
  totalRecords,
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
        <Text as="label" htmlFor="Items-per-page" mr={'1%'} ml="auto">
          <Trans>Items per page:</Trans>
        </Text>

        <Select
          id="Items-per-page"
          aria-label="Items per page"
          isDisabled={isLoadingMore}
          value={selectedDisplayLimit}
          borderColor="black"
          onChange={(e) => {
            setSelectedDisplayLimit(parseInt(e.target.value))
            resetToFirstPage() // Make sure to provide this as a prop if !onlyPagination
          }}
          width="fit-content"
        >
          {options}
        </Select>
      </>
    )
  }

  return (
    <Flex align="center" {...props}>
      <IconButton
        id="previousPageBtn"
        icon={<ChevronLeftIcon boxSize="2rem" />}
        onClick={previous}
        isDisabled={!hasPreviousPage}
        isLoading={isLoadingMore}
        aria-label="Previous page"
        variant="primaryOutline"
        bgColor="gray.50"
      />
      <IconButton
        id="nextPageBtn"
        icon={<ChevronRightIcon boxSize="2rem" />}
        onClick={next}
        isDisabled={!hasNextPage}
        isLoading={isLoadingMore}
        aria-label="Next page"
        ml="2"
        variant="primaryOutline"
        bgColor="gray.50"
      />
      {totalRecords > 0 && (
        <>
          <Divider mx="2" orientation="vertical" borderLeftColor="gray.900" height="1.5rem" />
          <Text>
            <Trans>{totalRecords} total item(s)</Trans>
          </Text>
        </>
      )}
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
  totalRecords: number,
}
