import React from 'react'
import { PieChart } from 'react-minimal-pie-chart'
import { Text, Stack, Box } from '@chakra-ui/core'
import { objectOf, number, string, shape, arrayOf } from 'prop-types'

function SummaryCard({ title, categoryDisplay, description, data }) {
  const compareStrengths = (a, b) =>
    a.count < b.count ? 1 : b.count < a.count ? -1 : 0

  return (
    <Box bg="white" rounded="lg" overflow="hidden" boxShadow={'medium'}>
      <Box bg="gray.550" px="2em">
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

      <PieChart
        data={data.categories.map(({ name, count }) => ({
          title: categoryDisplay[name].name,
          color: categoryDisplay[name].color,
          value: count,
        }))}
        radius={43}
        lineWidth={42}
      />
      <Stack align="center" spacing={0}>
        {data.categories
          .sort(compareStrengths)
          .map(({ name, count, percentage }) => {
            return (
              <Text
                key={`${name}:Badge:${count}:${percentage}`}
                color="white"
                px="0.5em"
                backgroundColor={categoryDisplay[name].color}
                fontWeight="bold"
                fontSize="sm"
                width="100%"
                textAlign="center"
              >
                {`${categoryDisplay[name].name}: ${count} - ${percentage}% `}
              </Text>
            )
          })}
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
