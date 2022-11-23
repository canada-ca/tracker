import React from 'react'
import { array, string } from 'prop-types'
import { Accordion, Box, Heading, Stack, Text } from '@chakra-ui/react'
import { WarningTwoIcon } from '@chakra-ui/icons'
import { t, Trans } from '@lingui/macro'
import { GuidanceTagDetails } from './GuidanceTagDetails'

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

  const setTagList = (tagList, tagType) => {
    if (tagList?.length > 0) {
      const tagTypeList = tagList.map((guidanceTag, index) => {
        return (
          <Box
            key={guidanceTag + index}
            bg={
              tagType === 'negative'
                ? 'weakMuted'
                : tagType === 'positive'
                ? 'strongMuted'
                : 'infoMuted'
            }
            mb="1"
            rounded="md"
          >
            <GuidanceTagDetails
              guidanceTag={guidanceTag.node || guidanceTag}
              tagType={tagType}
            />
          </Box>
        )
      })
      return tagTypeList
    }
  }

  const negativeTagList = setTagList(negativeTags, 'negative')
  const positiveTagList = setTagList(positiveTags, 'positive')
  const neutralTagList = setTagList(neutralTags, 'informative')

  const noTags = (
    <Stack isInline align="center" bg="moderateMuted" px="2">
      <WarningTwoIcon
        color="moderate"
        display={{ base: 'none', md: 'initial' }}
      />
      <Box>
        <Stack isInline align="center">
          <WarningTwoIcon
            color="moderate"
            display={{ base: 'initial', md: 'none' }}
          />
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
          <Trans>
            If you believe this was caused by a problem with Tracker, please use
            the "Report an Issue" link below
          </Trans>
        </Text>
      </Box>
    </Stack>
  )

  return (
    <Box>
      {selectorHeading}
      {negativeTagList?.length && negativeTagList}
      {neutralTagList?.length && neutralTagList}
      {positiveTagList?.length && positiveTagList}

      {!positiveTagList?.length &&
        !neutralTagList?.length &&
        !negativeTagList?.length &&
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
