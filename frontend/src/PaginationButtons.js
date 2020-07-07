// import React from 'react'
// import { Stack, IconButton } from '@chakra-ui/core'
// import { bool } from 'prop-types'

// export function PaginationButtons({ previous, next }) {
//   return (
//     <Stack isInline justifyContent="end">
//       <IconButton
//         variantColor="blue"
//         aria-label="Previous page"
//         icon="arrow-back"
//         onClick={() => {
//           window.alert('previous page')
//         }}
//         isDisabled={
//           // Determine if the previous button should be disabled
//           !previous
//         }
//       />
//       <IconButton
//         variantColor="blue"
//         aria-label="Next page"
//         icon="arrow-forward"
//         onClick={() => {
//           window.alert('next page')
//         }}
//         isDisabled={
//           // Determine if the next button should be disabled
//           !next
//         }
//       />
//     </Stack>
//   )
// }
// PaginationButtons.propTypes = {
//   next: bool.isRequired,
//   previous: bool.isRequired,
// }

import React from 'react'
import { number, func } from 'prop-types'
import { Button, Stack } from '@chakra-ui/core'

export function PaginationButtons({ perPage, total, paginate }) {
  const pageNumbers = []

  for (let i = 1; i <= Math.ceil(total / perPage); i++) {
    pageNumbers.push(i)
  }

  return (
    <Stack isInline align="center">
      {pageNumbers.map((number) => (
        <Button key={number} onClick={() => paginate(number)}>
          {number}
        </Button>
      ))}
    </Stack>
  )
}

PaginationButtons.propTypes = {
  perPage: number.isRequired,
  total: number.isRequired,
  paginate: func.isRequired,
}
