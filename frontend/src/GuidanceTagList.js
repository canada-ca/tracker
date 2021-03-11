import React from 'react'
import { array, string } from 'prop-types'
import { Box, Divider, Heading, Icon, Stack, Text } from '@chakra-ui/core'
import { GuidanceTagDetails } from './GuidanceTagDetails'
import { Trans } from '@lingui/macro'

export function GuidanceTagList({
  negativeTags,
  positiveTags,
  neutralTags,
  selector,
}) {
  const selectorHeading = (
    <Heading as="h3" size="sm">
      {selector}
    </Heading>
  )
  const negativeTagList =
    negativeTags?.length > 0 &&
    negativeTags.map((guidanceTag, index) => {
      return (
        <Box key={guidanceTag + index} bg="weakMuted" pb="1">
          <GuidanceTagDetails
            guidanceTag={guidanceTag.node}
            tagType="negative"
          />
          {
            // Add divider if next entry exists
            negativeTags[index + 1] && <Divider borderColor="gray.700" />
          }
        </Box>
      )
    })

  const positiveTagList =
    positiveTags?.length > 0 &&
    positiveTags.map((guidanceTag, index) => {
      return (
        <Box key={guidanceTag + index} bg="strongMuted" pb="1">
          <GuidanceTagDetails
            guidanceTag={guidanceTag.node}
            tagType="positive"
          />
          {
            // Add divider if next entry exists
            positiveTags[index + 1] && <Divider borderColor="gray.700" />
          }
        </Box>
      )
    })

  const neutralTagList =
    neutralTags?.length > 0 &&
    neutralTags.map((guidanceTag, index) => {
      return (
        <Box key={guidanceTag + index} bg="infoMuted" pb="1">
          <GuidanceTagDetails
            guidanceTag={guidanceTag.node}
            tagType="neutral"
          />
          {
            // Add divider if next entry exists
            neutralTags[index + 1] && <Divider borderColor="gray.700" />
          }
        </Box>
      )
    })

  const properlyConfigured = (
    <Stack isInline align="center" bg="strongMuted" px="2">
      <Icon name="check-circle" color="strong" />
      <Text>
        <Trans>Properly configured!</Trans>
      </Text>
    </Stack>
  )

  return (
    <Box my="2">
      {selectorHeading}
      {positiveTagList}
      <Divider borderColor="gray.50" />
      {neutralTagList}
      <Divider borderColor="gray.50" />
      {negativeTagList}
      {!positiveTagList.length &&
        !neutralTagList.length &&
        !negativeTagList.length &&
        properlyConfigured}
    </Box>
  )
}

GuidanceTagList.propTypes = {
  negativeTags: array,
  positiveTags: array,
  neutralTags: array,
  selector: string,
}
