import React from 'react'
import { Box, Text, List, Stack } from '@chakra-ui/core'
import { string, func, array } from 'prop-types'

const CustomTooltipContent = ({ label, payload, formatter }) => {
  const listItems = payload.map((entry) => {
    if (entry !== undefined) {
      return (
        <Stack isInline key={entry.dataKey} color={entry.color}>
          <Text>{`${entry.name} :`}</Text>
          <Text ml="auto">{` ${formatter(entry.payload[entry.dataKey])}`}</Text>
        </Stack>
      )
    }
  })
  return (
    <Box
      backgroundColor="white"
      margin="0px"
      padding="10px"
      borderWidth="1px"
      borderStyle="solid"
      borderColor="#ccc"
    >
      <Text>{label}</Text>
      <List as="ul" styleType="none">
        {listItems}
      </List>
    </Box>
  )
}

CustomTooltipContent.propTypes = {
  formatter: func,
  label: string,
  payload: array,
}

CustomTooltipContent.defaultProps = {
  separator: ' : ',
  formatter: (value) => value,
}

export default CustomTooltipContent
