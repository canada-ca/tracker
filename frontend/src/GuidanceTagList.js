import React from 'react'
import { array, string } from 'prop-types'
import { Box, Divider, Heading, Icon, Stack, Text } from '@chakra-ui/core'
import { GuidanceTagDetails } from './GuidanceTagDetails'
import { Trans } from '@lingui/macro'

export function GuidanceTagList({ guidanceTags, categoryName, selector }) {
  const selectorHeading = (
    <Heading as="h3" size="sm">
      {selector}
    </Heading>
  )

  const tagList = guidanceTags.length ? (
    guidanceTags.map((guidanceTag, index) => {
      return (
        <Box key={guidanceTag}>
          <GuidanceTagDetails
            guidanceTag={guidanceTag}
            categoryName={categoryName}
          />
          {
            // Add divider if next entry exists
            guidanceTags[index + 1] && <Divider borderColor="gray.700" />
          }
        </Box>
      )
    })
  ) : (
    <Stack isInline align="center">
      <Icon name="check-circle" color="strong" />
      <Text>
        <Trans>Properly configured!</Trans>
      </Text>
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
