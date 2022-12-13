import React from 'react'
import { array, string } from 'prop-types'
import { Box, Heading, Text, Flex, Link, Accordion } from '@chakra-ui/react'
import { ExternalLinkIcon, WarningTwoIcon } from '@chakra-ui/icons'
import { Trans } from '@lingui/macro'
import { NewGuidanceTagDetails } from './NewGuidanceTagDetails'

export function NewGuidanceTagList({
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
            mx="2"
          >
            <NewGuidanceTagDetails
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
    <Box bg="moderateMuted" px="2" py="1" rounded="md" mx="2">
      <Flex align="center" mb="2" fontSize="lg" fontWeight="bold">
        <WarningTwoIcon
          mr="2"
          color="moderate"
          display={{ base: 'none', md: 'initial' }}
        />

        <Text>
          <Trans>No guidance found for this category</Trans>
        </Text>
      </Flex>
      <Box>
        <Text>
          <Trans>
            This could be due to improper configuration, or could be the result
            of a scan error
          </Trans>
        </Text>

        <Text>
          <Trans>
            If you believe this was caused by a problem with Tracker, please{' '}
            <Link
              color="blue.600"
              href="https://github.com/canada-ca/tracker/issues"
              isExternal
            >
              Report an Issue <ExternalLinkIcon />
            </Link>
          </Trans>
        </Text>
      </Box>
    </Box>
  )

  return (
    <Accordion allowMultiple defaultIndex={[]}>
      {selectorHeading}
      {negativeTagList?.length && negativeTagList}
      {neutralTagList?.length && neutralTagList}
      {positiveTagList?.length && positiveTagList}

      {!positiveTagList?.length &&
        !neutralTagList?.length &&
        !negativeTagList?.length &&
        noTags}
    </Accordion>
  )
}

NewGuidanceTagList.propTypes = {
  negativeTags: array,
  positiveTags: array,
  neutralTags: array,
  selector: string,
}
