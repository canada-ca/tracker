import React from 'react'
import { PieChart } from 'react-minimal-pie-chart'
import { Text, Stack, Box } from '@chakra-ui/core'
import { objectOf, number, string, shape, arrayOf } from 'prop-types'

function SummaryCard({ title, categoryDisplay, description, data }) {
  return (
    <Box
      bg="white"
      rounded="lg"
      overflow="hidden"
      boxShadow="medium"
      width="min-content"
    >
      <Box bg="blue.900" px="8">
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

      <Box width="boxes.2">
        <PieChart
          data={data.categories.map(({ name, count }) => ({
            title: categoryDisplay[name].name,
            color: categoryDisplay[name].color,
            value: count,
          }))}
          radius={43}
          lineWidth={42}
          paddingAngle={1}
        />
      </Box>
      <Stack align="center" spacing={0}>
        {data.categories
          .map(({ name, count, percentage }) => {
            return (
              <Text
                key={`${name}:Badge:${count}:${percentage}`}
                color="white"
                px="2"
                backgroundColor={categoryDisplay[name].color}
                fontWeight="bold"
                fontSize="sm"
                width="100%"
                textAlign="center"
              >
                {`${categoryDisplay[name].name}: ${count} - ${percentage}% `}
              </Text>
            )
          })
          .sort((a, b) => a.count - b.count) // mutate the array last
        }
      </Stack>
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
