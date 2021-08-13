import React from 'react'
import { object, string } from 'prop-types'
import { Box, Link, Stack, Text } from '@chakra-ui/react'
import {
  CheckCircleIcon,
  ExternalLinkIcon,
  InfoIcon,
  WarningIcon,
} from '@chakra-ui/icons'
import { Trans } from '@lingui/macro'

export function GuidanceTagDetails({ guidanceTag, tagType }) {
  const cccsGuidance =
    guidanceTag.refLinks[0]?.description !== null &&
    guidanceTag.refLinks.length !== 0 ? (
      <Stack isInline={guidanceTag.refLinks.length <= 1}>
        <Text fontWeight="bold">
          <Trans>For in-depth CCCS implementation guidance:</Trans>
        </Text>
        {guidanceTag.refLinks.map((node, index) => (
          <Link
            key={index}
            color="teal.700"
            href={node.refLink}
            target="_blank"
          >
            <Stack isInline spacing="2px" align="center">
              <Text>{node.description}</Text>
              <ExternalLinkIcon aria-hidden="true" />
            </Stack>
          </Link>
        ))}
      </Stack>
    ) : (
      ''
    )

  const technicalGuidance =
    guidanceTag.refLinksTech.length !== 0 &&
    guidanceTag.refLinksTech[0]?.description !== null ? (
      <Stack isInline={guidanceTag.refLinksTech.length <= 1}>
        <Text fontWeight="bold">
          <Trans>For technical implementation guidance:</Trans>
        </Text>
        {guidanceTag.refLinksTech.map((node, index) => (
          <Link
            key={index}
            color="teal.700"
            href={node.refLink}
            target="_blank"
          >
            <Stack isInline spacing="2px" align="center">
              <Text>{node.description}</Text>
              <ExternalLinkIcon aria-hidden="true" />
            </Stack>
          </Link>
        ))}
      </Stack>
    ) : (
      ''
    )

  const tagIcon = (props) => {
    if (tagType === 'negative')
      return <WarningIcon color="weak" {...props} aria-label="negative tag" />
    else if (tagType === 'neutral')
      return <InfoIcon color="info" {...props} aria-label="neutral tag" />
    else if (tagType === 'positive')
      return (
        <CheckCircleIcon color="strong" {...props} aria-label="positive tag" />
      )
  }

  return (
    <Stack isInline align="center" px="2" pt="2">
      {tagIcon({ display: { base: 'none', md: 'inherit' } })}
      <Box>
        <Stack isInline align="center">
          {tagIcon({ display: { base: 'inherit', md: 'none' } })}
          <Text fontWeight="bold" ml={{ base: 2, md: 0 }}>
            <Trans>Result:</Trans>
          </Text>
          <Text>{guidanceTag.tagName}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Guidance:</Trans>
          </Text>
          <Text>{guidanceTag.guidance}</Text>
        </Stack>
        {cccsGuidance}
        {technicalGuidance}
      </Box>
    </Stack>
  )
}

GuidanceTagDetails.propTypes = {
  guidanceTag: object,
  tagType: string,
}
