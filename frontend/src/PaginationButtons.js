import React from 'react'
import { number, func } from 'prop-types'
import { Stack, Text, IconButton, Select } from '@chakra-ui/core'

export function PaginationButtons({
  perPage,
  total,
  paginate,
  currentPage,
  setPerPage,
}) {
  return (
    <Stack isInline align="center">
      <IconButton
        icon="arrow-left"
        onClick={() => paginate(1)}
        disabled={currentPage === 1}
        aria-label="Skip to first page"
      />
      <IconButton
        icon="chevron-left"
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      />
      <IconButton
        icon="chevron-right"
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === Math.ceil(total / perPage)}
        aria-label="Next page"
      />
      <IconButton
        icon="arrow-right"
        onClick={() => paginate(Math.ceil(total / perPage))}
        disabled={currentPage === Math.ceil(total / perPage)}
        aria-label="Skip to last page"
      />
      <Text fontWeight="semibold">
        Page {currentPage} of {Math.ceil(total / perPage)}
      </Text>
      {setPerPage && (
        <Select
          w="30"
          value={perPage}
          onChange={(e) => {
            setPerPage(Number(e.target.value))
          }}
        >
          {[5, 10, 20].map((perPage) => (
            <option key={perPage} value={perPage}>
              Show {perPage}
            </option>
          ))}
        </Select>
      )}
    </Stack>
  )
}

PaginationButtons.propTypes = {
  perPage: number.isRequired,
  total: number.isRequired,
  paginate: func.isRequired,
  currentPage: number.isRequired,
  setPerPage: func,
}
