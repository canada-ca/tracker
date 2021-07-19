import React from 'react'
import { array, string } from 'prop-types'
import {
  Box,
  Button,
  Collapse,
  Divider,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react'
import { WarningTwoIcon } from '@chakra-ui/icons'
import { GuidanceTagDetails } from './GuidanceTagDetails'
import { Trans } from '@lingui/macro'

export function GuidanceTagList({
  negativeTags,
  positiveTags,
  neutralTags,
  selector,
}) {
  const [showPosi, setShowPosi] = React.useState(true)
  const [showNega, setShowNega] = React.useState(true)
  const [showNeut, setShowNeut] = React.useState(true)
  const handleShowPosi = () => setShowPosi(!showPosi)
  const handleShowNega = () => setShowNega(!showNega)
  const handleShowNeut = () => setShowNeut(!showNeut)

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
            <GuidanceTagDetails
              guidanceTag={guidanceTag.node}
              tagType={tagType}
            />
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
      {positiveTagList?.length && (
        <Box>
          <Button variant="strong" mb="2" onClick={handleShowPosi} w="100%">
            <Trans>Positive Tags</Trans>
          </Button>
          <Collapse in={showPosi}>{positiveTagList}</Collapse>
          <Divider borderColor="gray.50" />
        </Box>
      )}

      {neutralTagList?.length && (
        <Box>
          <Button mb="2" onClick={handleShowNeut} variant="info" w="100%">
            <Trans>Neutral Tags</Trans>
          </Button>
          <Collapse in={showNeut}>{neutralTagList}</Collapse>
          <Divider borderColor="gray.50" />
        </Box>
      )}

      {negativeTagList?.length && (
        <Box>
          <Button variant="weak" mb="2" onClick={handleShowNega} w="100%">
            <Trans>Negative Tags</Trans>
          </Button>
          <Collapse in={showNega}>{negativeTagList}</Collapse>
        </Box>
      )}
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
