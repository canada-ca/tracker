import React from 'react'
import { object } from 'prop-types'
import { Box, Icon, Link, Stack, Text } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'

export function GuidanceTagDetails({ guidanceTag }) {
  const cccsGuidance =
    guidanceTag.refLinks !== null && guidanceTag.refLinks.length !== 0 ? (
      <Stack isInline>
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
    guidanceTag.refLinksTech !== null ? (
      <Stack isInline>
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

  const warningIcon = <Icon name="warning" color="weak" />

  return (
    <Stack isInline align="center" px="2" pt={['2', '0']}>
      {!smallDevice && warningIcon}
      <Box>
        <Stack isInline>
          {smallDevice && warningIcon}
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
}
