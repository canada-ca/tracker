import React from 'react'
import { array, string } from 'prop-types'
import { Box, Heading } from '@chakra-ui/core'
import { GuidanceTagDetails } from './GuidanceTagDetails'

export function GuidanceTagList({ guidanceTags, selector }) {
  const selectorHeading = (
    <Heading as="h3" size="sm">
      {selector}
    </Heading>
  )

  return (
    <Box>
      {selectorHeading}
      {guidanceTags.map((guidanceTag) => (
        <GuidanceTagDetails guidanceTag={guidanceTag} />
      ))}
    </Box>
  )
}

GuidanceTagList.propTypes = {
  guidanceTags: array,
  selector: string,
}
