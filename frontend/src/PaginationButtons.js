import React from 'react'
import { number, func } from 'prop-types'
import { Button, Stack, Text, IconButton } from '@chakra-ui/core'

export function PaginationButtons({ perPage, total, paginate, currentPage }) {
  const pageNumbers = []

  for (let i = 1; i <= Math.ceil(total / perPage); i++) {
    pageNumbers.push(i)
  }

  return (
    // Number Pagination
    // <Stack>
    //   <Stack isInline align="center">
    //     {pageNumbers.map((number) => (
    //       <Button key={number} onClick={() => paginate(number)}>
    //         {number}
    //       </Button>
    //     ))}
    //   </Stack>
    //   <Text fontWeight="semibold">
    //     Page {currentPage} of {Math.ceil(total / perPage)}
    //   </Text>
    // </Stack>

    // Arrow Pagination
    <Stack isInline align="center">
      <IconButton
        icon="arrow-left"
        onClick={() => paginate(1)}
        disabled={currentPage === 1}
      />
      <IconButton
        icon="chevron-left"
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
      />
      <IconButton
        icon="chevron-right"
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === Math.ceil(total / perPage)}
      />
      <IconButton
        icon="arrow-right"
        onClick={() => paginate(Math.ceil(total / perPage))}
        disabled={currentPage === Math.ceil(total / perPage)}
      />
      <Text fontWeight="semibold">
        Page {currentPage} of {Math.ceil(total / perPage)}
      </Text>
    </Stack>
  )
}

PaginationButtons.propTypes = {
  perPage: number.isRequired,
  total: number.isRequired,
  paginate: func.isRequired,
  currentPage: number.isRequired,
}
