import React from 'react'
import PropTypes from 'prop-types'
import { Box, Text } from '@chakra-ui/react'

export function DetailList({ details }) {
  const mappedDetails = details.map((detail, idx) => {
    return (
      <Text key={`${detail.category}-${idx}`}>
        <b>{detail.category}</b>: {detail.description}
      </Text>
    )
  })

  return (
    <Box bg="gray.100" px="2" py="1">
      {mappedDetails}
    </Box>
  )
}

DetailList.propTypes = {
  details: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string,
      description: PropTypes.string,
    }),
  ).isRequired,
}
