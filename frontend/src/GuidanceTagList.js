import React from 'react'
import { array, string } from 'prop-types'
import { Box, Heading, Icon, Stack, Text } from '@chakra-ui/core'
import { GuidanceTagDetails } from './GuidanceTagDetails'

export function GuidanceTagList({ guidanceTags, categoryName, selector }) {
  const selectorHeading = (
    <Heading as="h3" size="sm">
      {selector}
    </Heading>
  )

  const tagList = guidanceTags.length ? (
    guidanceTags.map((guidanceTag) => (
      <GuidanceTagDetails guidanceTag={guidanceTag} categoryName={categoryName} />
    ))
  ) : (
    <Stack isInline align="center">
      <Icon name="check-circle" color="strong" />
      <Text>Properly configured!</Text>
    </Stack>
  )

  return (
    <Box>
      {selectorHeading}
      {tagList}
    </Box>
  )
}

GuidanceTagList.propTypes = {
  guidanceTags: array,
  categoryName: string,
  selector: string,
}
