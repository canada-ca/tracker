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
          For in-depth CCCS implementation guidance:
        </Text>
        <Link
          color="teal.500"
          href={i18n._(
            guidanceTags[categoryName][guidanceTag].ref_links_guide.link,
          )}
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
        <Text fontWeight="bold">For technical implementation guidance:</Text>
        <Link
          color="teal.500"
          href={i18n._(
            guidanceTags[categoryName][guidanceTag].ref_links_technical.link,
          )}
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

  return (
    <Stack isInline align="center">
      <Icon name="warning" color="weak" />
      <Box>
        <Stack isInline>
          <Text fontWeight="bold">Tag, Tag Name:</Text>
          <Text>
            <Trans id={guidanceTag} />
            <Trans id={guidanceTags[categoryName][guidanceTag].tag_name} />
          </Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">Guidance:</Text>
          <Text>
            <Trans id={guidanceTags[categoryName][guidanceTag].guidance} />
          </Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">Summary:</Text>
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
