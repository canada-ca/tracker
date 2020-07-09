import React from 'react'
import { string } from 'prop-types'
import { guidanceTags } from './guidanceTagConstants'
import { Box, Icon, Link, Stack, Text } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'

export function GuidanceTagDetails({ guidanceTag, categoryName }) {
  // const cccsGuidance = (
  //   <Stack isInline>
  //     <Text fontWeight="bold">For in-depth CCCS implementation guidance:</Text>
  //     <Link href={guidanceTags[categoryName][guidanceTag].ref_links_guide.link}>
  //       <Text>{guidanceTags[categoryName][guidanceTag].summary}</Text>
  //     </Link>
  //   </Stack>
  // )
  //
  // const technicalGuidance = (
  //   <Stack isInline>
  //     <Text fontWeight="bold">For technical implementation guidance:</Text>
  //     <Text>{guidanceTags[categoryName][guidanceTag].summary}</Text>
  //   </Stack>
  // )

  return (
    <Stack isInline align="center">
      <Icon name="warning" color="weak" />
      <Box>
        <Stack isInline>
          <Text fontWeight="bold">Tag, Tag Name:</Text>
          <Text>{`${guidanceTag}, ${guidanceTags[categoryName][guidanceTag].tag_name}`}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">Guidance:</Text>
          <Text>{guidanceTags[categoryName][guidanceTag].guidance}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">Summary:</Text>
          <Text>{guidanceTags[categoryName][guidanceTag].summary}</Text>
        </Stack>
      </Box>
    </Stack>
  )
}

GuidanceTagDetails.propTypes = {
  guidanceTag: string,
  categoryName: string,
}
