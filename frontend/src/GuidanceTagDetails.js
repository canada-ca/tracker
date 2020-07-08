import React from 'react'
import { string } from 'prop-types'
import { guidanceTags } from './guidanceTagConstants'
import { Box, Icon, Stack, Text } from '@chakra-ui/core'

export function GuidanceTagDetails({ guidanceTag, categoryName }) {
  return (
    <Stack isInline align="center">
      <Icon name="warning" color="weak" />
      <Box>
        <Stack isInline>
          <Text fontWeight="bold">Tag, Tag Name:</Text>
          <Text>{`${guidanceTag}, ${ guidanceTags[categoryName][guidanceTag].tag_name }`}</Text>
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
