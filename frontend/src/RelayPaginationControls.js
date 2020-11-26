import { Button, Stack } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import React from 'react'
import { bool, func } from 'prop-types'

export function RelayPaginationControls({
  previous,
  hasPreviousPage,
  next,
  hasNextPage,
}) {
  return (
    <Stack isInline align="center" mb="4">
      <Button
        id="previousPageBtn"
        onClick={previous}
        disable={!!hasPreviousPage}
        aria-label="Previous page"
      >
        <Trans>Previous</Trans>
      </Button>

      <Button
        id="nextPageBtn"
        onClick={next}
        disable={!!hasNextPage}
        aria-label="Next page"
      >
        <Trans>Next</Trans>
      </Button>
    </Stack>
  )
}

RelayPaginationControls.propTypes = {
  previous: func,
  hasPreviousPage: bool,
  next: func,
  hasNextPage: bool,
}
