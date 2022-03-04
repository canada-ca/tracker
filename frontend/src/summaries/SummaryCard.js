import React from 'react'
import { Box, Text } from '@chakra-ui/react'
import { arrayOf, number, objectOf, shape, string } from 'prop-types'

import { Doughnut, Segment } from './Doughnut'

export function SummaryCard({
  title,
  categoryDisplay,
  description,
  data,
  ...props
}) {
  return (
    <Box
      rounded="lg"
      overflow="hidden"
      borderWidth="1px"
      borderColor="black"
      width={{ md: '100%', lg: '40%' }}
      {...props}
    >
      <Box px="8">
        <Text
          fontSize="xl"
          fontWeight="semibold"
          textAlign="left"
          color="primary"
          my="2"
        >
          {title}
        </Text>
        <Text fontSize="md" wordBreak="break-word" mb="2">
          {description}
        </Text>
      </Box>

      <Box align="center" borderTop="1px" borderColor="black">
        <Doughnut
          id={title.replace(/ /g, '')} // id is required as svg defs can conflict
          title={title}
          data={data.categories.map(({ name, count, percentage }) => ({
            title: categoryDisplay[name].name,
            color: categoryDisplay[name].color,
            count,
            percentage,
            total: data.total,
          }))}
          height={320}
          width={320}
          valueAccessor={(d) => d.count}
        >
          {(segmentProps, index) => (
            <Segment key={`segment:${index}`} {...segmentProps} />
          )}
        </Doughnut>
      </Box>
    </Box>
  )
}

SummaryCard.propTypes = {
  title: string.isRequired,
  description: string.isRequired,
  // An object of keys whose values have a shape:
  categoryDisplay: objectOf(
    shape({
      name: string.isRequired,
      color: string.isRequired,
    }),
  ),
  // An object with the following keys & values:
  data: shape({
    total: number.isRequired,
    categories: arrayOf(
      shape({
        name: string.isRequired,
        count: number.isRequired,
        percentage: number.isRequired,
      }),
    ),
  }),
}
