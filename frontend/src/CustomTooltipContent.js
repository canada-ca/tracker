import React from 'react'
import { Box, Grid, Text } from '@chakra-ui/react'
import { array, bool, func, string } from 'prop-types'

const CustomTooltipContent = ({
  label,
  payload,
  formatter,
  calculatePercentages,
}) => {
  const totalValue =
    payload !== undefined
      ? payload.reduce((acc, currentValue) => {
          return currentValue.payload[currentValue.dataKey] + acc
        }, 0)
      : 1

  const listItems = []
  if (payload !== undefined)
    payload.forEach((entry) => {
      if (entry !== undefined) {
        listItems.push(
          <Text
            key={`${entry.dataKey}-name`}
            color={entry.color}
          >{`${entry.name} :`}</Text>,
        )
        listItems.push(
          <Text
            mx="1rem"
            textAlign="right"
            key={`${entry.dataKey}-value`}
            color={entry.color}
          >{`${formatter(entry.payload[entry.dataKey])}`}</Text>,
        )
        if (calculatePercentages) {
          const percentage =
            Math.round(
              formatter((entry.payload[entry.dataKey] / totalValue) * 100),
            ) || 0
          listItems.push(
            <Text
              textAlign="right"
              key={`${entry.dataKey}-percent`}
              color={entry.color}
            >{`${percentage}%`}</Text>,
          )
        }
      }
    })

  const columns = calculatePercentages ? 3 : 2
  const templateColumns = `repeat(${columns}, auto)}`

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
      <Grid templateColumns={templateColumns}>{listItems}</Grid>
    </Box>
  )
}

CustomTooltipContent.propTypes = {
  formatter: func,
  label: string,
  payload: array,
  calculatePercentages: bool,
}

CustomTooltipContent.defaultProps = {
  separator: ' : ',
  formatter: (value) => value,
  calculatePercentages: false,
}

export default CustomTooltipContent
