import React from 'react'
import { object, string } from 'prop-types'
import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react'
import { CheckCircleIcon, ExternalLinkIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons'
import { t, Trans } from '@lingui/macro'

export function GuidanceTagDetails({ guidanceTag, tagType }) {
  const tagTypeList = {
    positive: t`Positive`,
    informative: t`Informative`,
    negative: t`Negative`,
  }

  const tagTypeColor = {
    positive: 'strong',
    informative: 'info',
    negative: 'weak',
  }

  const getTagCategoryFromId = (tagId) => {
    return tagId.split(/[0-9]/)[0].toUpperCase()
  }

  const cccsGuidance =
    guidanceTag.refLinks[0]?.description !== null && guidanceTag.refLinks.length !== 0 ? (
      <Stack isInline={guidanceTag.refLinks.length <= 1}>
        <Text fontWeight="bold">
          <Trans>Policy guidance:</Trans>
        </Text>
        {guidanceTag.refLinks.map((node, index) => (
          <Link key={index} color="teal.700" href={node.refLink} target="_blank">
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
    guidanceTag.refLinksTech.length !== 0 && guidanceTag.refLinksTech[0]?.description !== null ? (
      <Stack isInline={guidanceTag.refLinksTech.length <= 1}>
        <Text fontWeight="bold">
          <Trans>Technical implementation guidance:</Trans>
        </Text>
        {guidanceTag.refLinksTech.map((node, index) => (
          <Link key={index} color="teal.700" href={node.refLink} target="_blank">
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
    if (tagType === 'negative') return <WarningIcon color="weak" {...props} aria-label="negative tag" />
    else if (tagType === 'informative') return <InfoIcon color="info" {...props} aria-label="neutral tag" />
    else if (tagType === 'positive') return <CheckCircleIcon color="strong" {...props} aria-label="positive tag" />
  }

  return (
    <AccordionItem>
      <Flex align="center" color={tagTypeColor[tagType]} fontWeight="bold" as={AccordionButton} fontSize="lg">
        {tagIcon()}
        <Text ml="2">
          {guidanceTag?.count && `${getTagCategoryFromId(guidanceTag.tagId)}: `}
          {guidanceTag.tagName}
        </Text>
        <AccordionIcon />
        <Text ml="auto">
          {guidanceTag?.count ? <Trans>{guidanceTag?.count} Findings</Trans> : tagTypeList[tagType]?.toUpperCase()}
        </Text>
      </Flex>
      <AccordionPanel>
        <Box>
          <Text fontSize="lg" fontWeight="bold">
            {guidanceTag.guidance}
          </Text>

          {cccsGuidance}
          {technicalGuidance}

          {tagType === 'informative' && (
            <Text mt="2">
              <Trans>
                Informative tags highlight relevant configuration details, but are not addressed within policy
                requirements and have no impact on scoring.
              </Trans>
            </Text>
          )}
        </Box>
      </AccordionPanel>
    </AccordionItem>
  )
}

GuidanceTagDetails.propTypes = {
  guidanceTag: object,
  tagType: string,
}
