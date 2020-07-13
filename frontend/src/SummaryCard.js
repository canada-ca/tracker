import React, { useEffect, useRef } from 'react'
import { Text, Stack, Box } from '@chakra-ui/core'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { objectOf, number, string, shape, arrayOf } from 'prop-types'

function SummaryCard({ title, categoryDisplay, description, data }) {
  // TODO: refactor this so it doesn't need refs
  // This block will allow the donut to be as large as possible
  const ref = useRef(null)
  const [parentWidth, setParentWidth] = React.useState(0)
  useEffect(() => {
    if (ref.current) {
      setParentWidth(ref.current.offsetWidth)
    }
  }, [ref, setParentWidth])

  const compareStrengths = (a, b) =>
    a.count < b.count ? 1 : b.count < a.count ? -1 : 0

  return (
    <Box
      bg="white"
      rounded="lg"
      overflow="hidden"
      ref={ref}
      boxShadow={'medium'}
    >
      <Stack spacing={0}>
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

        <ResponsiveContainer width="100%" height={parentWidth}>
          <PieChart>
            <Pie
              data={data.categories.map((cat) => ({
                ...cat,
                ...{ name: categoryDisplay[cat.name].name },
              }))}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="90%"
              dataKey="count"
            >
              {data.categories.map(({ name, count }) => (
                <Cell
                  key={`${name}:DoughnutCell:${count}`}
                  fill={categoryDisplay[name].color}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
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
