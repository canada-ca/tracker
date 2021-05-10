import React from 'react'
import { object, string } from 'prop-types'
import { Box, Icon, Link, Stack, Text } from '@chakra-ui/core'
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
            color="teal.600"
            href={node.refLink}
            target="_blank"
          >
            <Stack isInline spacing="2px" align="center">
              <Text>{node.description}</Text>
              <Icon name="external-link" />
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
            color="teal.600"
            href={node.refLink}
            target="_blank"
          >
            <Stack isInline spacing="2px" align="center">
              <Text>{node.description}</Text>
              <Icon name="external-link" />
            </Stack>
          </Link>
        ))}
      </Stack>
    ) : (
      ''
    )

  const smallDevice = window.matchMedia('(max-width: 500px)').matches

  const negativeIcon = <Icon name="warning" color="weak" />
  const neutralIcon = <Icon name="info" color="info" />
  const positiveIcon = <Icon name="check-circle" color="strong" />

  const tagIcon = () => {
    if (tagType === 'negative') return negativeIcon
    else if (tagType === 'neutral') return neutralIcon
    else if (tagType === 'positive') return positiveIcon
  }

  return (
    <Stack isInline align="center" px="2" pt={['2', '0']}>
      {!smallDevice && tagIcon()}
      <Box>
        <Stack isInline align="center">
          {smallDevice && tagIcon()}
          <Text fontWeight="bold">
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
