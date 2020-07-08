import React from 'react'
import { string } from 'prop-types'
import { guidanceTags } from './guidanceTagConstants'
import { Box, Text } from '@chakra-ui/core'

export function GuidanceTagDetails({ guidanceTag, categoryName }) {
  return (
    <Box>
      <Text>{`${guidanceTag}: ${guidanceTags[categoryName][guidanceTag].tag_name}`}</Text>
      <Text fontWeight="bold">{`Guidance: ${guidanceTags[categoryName][guidanceTag].guidance}`}</Text>
      <Text>{`Summary: ${guidanceTags[categoryName][guidanceTag].summary}`}</Text>
    </Box>
  )
}

GuidanceTagDetails.propTypes = {
  guidanceTag: string,
  categoryName: string,
}
