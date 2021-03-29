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

  const smallDevice = window.matchMedia('(max-width: 500px)').matches
  const noTags = (
    <Stack isInline align="center" bg="moderateMuted" px="2">
      {!smallDevice && <Icon name="warning-2" color="moderate" />}
      <Box>
        <Stack isInline align="center">
          {smallDevice && <Icon name="warning-2" color="moderate" />}
          <Text fontWeight="bold">
            <Trans>Result:</Trans>
          </Text>
          <Text>
            <Trans>No guidance tags were found for this scan category</Trans>
          </Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Guidance:</Trans>
          </Text>
          <Text>
            <Trans>
              This could be due to improper configuration, or could be the
              result of a scan error
            </Trans>
          </Text>
        </Stack>
        <Text fontWeight="bold">
          <Trans>If you believe this was caused by a problem with Tracker, please use the "Report an Issue" link below</Trans>
        </Text>
      </Box>
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
        noTags}
    </Box>
  )
}

GuidanceTagList.propTypes = {
  negativeTags: array,
  positiveTags: array,
  neutralTags: array,
  selector: string,
}
