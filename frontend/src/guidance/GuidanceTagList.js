import React from 'react'
import { array, string } from 'prop-types'
import { Accordion, Box, Divider, Heading, Stack, Text } from '@chakra-ui/react'
import { WarningTwoIcon } from '@chakra-ui/icons'
import { t, Trans } from '@lingui/macro'
import { GuidanceTagDetails } from './GuidanceTagDetails'
import { TrackerAccordionItem as AccordionItem } from '../components/TrackerAccordionItem'

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
            pb="1"
          >
            {guidanceTag.node ? (
              <GuidanceTagDetails
                guidanceTag={guidanceTag.node}
                tagType={tagType}
              />
            ) : (
              <GuidanceTagDetails guidanceTag={guidanceTag} tagType={tagType} />
            )}

            {
              // Add divider if next entry exists
              tagList[index + 1] && <Divider borderColor="gray.700" />
            }
          </Box>
        )
      })
      return tagTypeList
    }
  }

  const negativeTagList = setTagList(negativeTags, 'negative')
  const positiveTagList = setTagList(positiveTags, 'positive')
  const neutralTagList = setTagList(neutralTags, 'neutral')

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
    <Box my="2">
      {selectorHeading}
      <Accordion allowMultiple defaultIndex={[0]}>
        {negativeTagList?.length && (
          <AccordionItem buttonLabel={t`Negative Tags`} buttonVariant="weak">
            {negativeTagList}
          </AccordionItem>
        )}

        {neutralTagList?.length && (
          <AccordionItem buttonLabel={t`Neutral Tags`} buttonVariant="info">
            <Box>
              <Trans>
                Neutral tags highlight relevant configuration details, but are
                not addressed within policy requirements and have no impact on
                scoring.
              </Trans>
            </Box>
            {neutralTagList}
          </AccordionItem>
        )}
        {positiveTagList?.length && (
          <AccordionItem buttonLabel={t`Positive Tags`} buttonVariant="strong">
            {positiveTagList}
          </AccordionItem>
        )}
      </Accordion>
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
