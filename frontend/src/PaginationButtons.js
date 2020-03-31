import React from 'react'
import { Stack, IconButton } from '@chakra-ui/core'

export function PaginationButtons({previous, next}) {
  return (
    <Stack isInline justifyContent="end">
      <IconButton
        variantColor="blue"
        aria-label="Previous page"
        icon="arrow-back"
        onClick={() => {
          window.alert('previous page')
        }}
        isDisabled={
          // Determine if the previous button should be disabled
          !previous
        }
      />
      <IconButton
        role="nextPageButton"
        variantColor="blue"
        aria-label="Next page"
        icon="arrow-forward"
        onClick={() => {
          window.alert('next page')
        }}
        isDisabled={
          // Determine if the next button should be disabled
          !next
        }
      />
    </Stack>
  )
}
