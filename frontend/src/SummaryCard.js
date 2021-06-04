import React from 'react'
import { Text, Box } from '@chakra-ui/core'
import { objectOf, number, string, shape, arrayOf } from 'prop-types'
import { Doughnut, Segment } from './Doughnut'

function SummaryCard({ title, categoryDisplay, description, data }) {
  return (
    <Box
      bg="primary"
      rounded="lg"
      overflow="hidden"
      boxShadow="medium"
      width="min-content"
      height="auto"
    >
      <Box bg="primary" px="8">
        <Text
          fontSize="xl"
          fontWeight="semibold"
          textAlign="center"
          color="white"
        >
          {title}
        </Text>
        <Text
          fontSize="md"
          textAlign="center"
          color="white"
          wordBreak="break-word"
        >
          {description}
        </Text>
      </Box>

      <Box width="boxes.2" bg="white">
        <Doughnut
          title={title}
          data={data.categories.map(({ name, count, percentage }) => ({
            title: categoryDisplay[name].name,
            count,
            percentage,
            total: data.total,
          }))}
          color={[
            categoryDisplay.pass.color,
            categoryDisplay.fail.color,
            categoryDisplay.unscanned.color,
          ]}
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

export default SummaryCard
