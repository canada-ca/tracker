import { Button, Stack, Select, Text } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import React from 'react'
import { array, bool, func, number } from 'prop-types'

export function RelayPaginationControls({
  previous,
  hasPreviousPage,
  next,
  hasNextPage,
  selectedDisplayLimit,
  setSelectedDisplayLimit,
  displayLimitOptions,
  onlyPagination,
  isDisabled,
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
        <Text ml="auto">
          <Trans>Page Size:</Trans>
        </Text>

        <Select
          isDisabled={isDisabled}
          value={selectedDisplayLimit}
          onChange={(e) => setSelectedDisplayLimit(parseInt(e.target.value))}
          width="fit-content"
        >
          {options}
        </Select>
      </>
    )
  }

  return (
    <Stack isInline align="center" mb="4" {...props}>
      <Button
        id="previousPageBtn"
        onClick={previous}
        isDisabled={!hasPreviousPage || isDisabled}
        aria-label="Previous page"
      >
        <Trans>Previous</Trans>
      </Button>

      <Button
        id="nextPageBtn"
        onClick={next}
        isDisabled={!hasNextPage || isDisabled}
        aria-label="Next page"
      >
        <Trans>Next</Trans>
      </Button>

      {displayLimitControls}
    </Stack>
  )
}

RelayPaginationControls.propTypes = {
  previous: func,
  hasPreviousPage: bool,
  next: func,
  hasNextPage: bool,
  selectedDisplayLimit: number,
  setSelectedDisplayLimit: func,
  displayLimitOptions: array,
  onlyPagination: bool,
  isDisabled: bool,
}
