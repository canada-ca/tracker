import React from 'react'
import { string } from 'prop-types'
import { guidanceTags } from './guidanceTagConstants'
import { Box, Icon, Link, Stack, Text } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'

export function GuidanceTagDetails({ guidanceTag, categoryName }) {
  const { i18n } = useLingui()

  const cccsGuidance =
    guidanceTags[categoryName][guidanceTag].ref_links_guide !== null &&
    guidanceTags[categoryName][guidanceTag].ref_links_guide !== undefined ? (
      <Stack isInline>
        <Text fontWeight="bold">
          <Trans>For in-depth CCCS implementation guidance:</Trans>
        </Text>
        <Link
          color="teal.500"
          href={i18n._(
            guidanceTags[categoryName][guidanceTag].ref_links_guide.link,
          )}
          target="_blank"
        >
          <Stack isInline spacing="2px" align="center">
            <Text>
              <Trans
                id={
                  guidanceTags[categoryName][guidanceTag].ref_links_guide
                    .heading
                }
              />
            </Text>
            <Icon name="external-link" />
          </Stack>
        </Link>
      </Stack>
    ) : (
      ''
    )

  const technicalGuidance =
    guidanceTags[categoryName][guidanceTag].ref_links_technical !== undefined &&
    guidanceTags[categoryName][guidanceTag].ref_links_technical !== null ? (
      <Stack isInline>
        <Text fontWeight="bold">
          <Trans>For technical implementation guidance:</Trans>
        </Text>
        <Link
          color="teal.500"
          href={i18n._(
            guidanceTags[categoryName][guidanceTag].ref_links_technical.link,
          )}
          target="_blank"
        >
          <Stack isInline spacing="2px" align="center">
            <Text>
              <Trans
                id={
                  guidanceTags[categoryName][guidanceTag].ref_links_technical
                    .heading
                }
              />
              {
                // Display subheading if exists
                guidanceTags[categoryName][guidanceTag]
                  .ref_links_technical_subheading &&
                  `, ${guidanceTags[categoryName][guidanceTag].ref_links_technical_subheading}`
              }
            </Text>
            <Icon name="external-link" />
          </Stack>
        </Link>
      </Stack>
    ) : (
      ''
    )

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
    })),
  })

  const smallDevice = window.matchMedia('(max-width: 500px)').matches

  const warningIcon = <Icon name="warning" color="weak" />

  return (
    <Stack isInline align="center">
      {!smallDevice && warningIcon}
      <Box>
        <Stack isInline>
          {smallDevice && warningIcon}
          <Text fontWeight="bold">
            <Trans>Tag, Tag Name:</Trans>
          </Text>
          <Text>
            <Trans id={guidanceTag} />
            {', '}
            <Trans id={guidanceTags[categoryName][guidanceTag].tag_name} />
          </Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Guidance:</Trans>
          </Text>
          <Text>
            <Trans id={guidanceTags[categoryName][guidanceTag].guidance} />
          </Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Summary:</Trans>
          </Text>
          <Text>
            <Trans id={guidanceTags[categoryName][guidanceTag].summary} />
          </Text>
        </Stack>
        {cccsGuidance}
        {technicalGuidance}
      </Box>
    </Stack>
  )
}

GuidanceTagDetails.propTypes = {
  guidanceTag: string,
  categoryName: string,
}
