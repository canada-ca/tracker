import React from 'react'
import theme from './theme/canada'
import { Text, Stack, Box } from '@chakra-ui/core'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { string, array } from 'prop-types'

const { colors } = theme

export function SummaryCard({ ...props }) {
  const { name, title, description, data } = props

  const reducer = (accumulator, currentValue) => {
    return accumulator + currentValue
  }

  data.forEach((entry) => {
    entry.value = entry.categories
      .map((category) => category.qty)
      .reduce(reducer)
  })

  const totalQty = data
    .map((entry) => {
      return entry.value
    })
    .reduce(reducer)

  data.forEach((entry) => {
    entry.percent = Math.round((entry.value / totalQty) * 100 * 10) / 10
  })

  return (
    <Box w="100%" rounded="lg" bg="white" overflow="hidden">
      <Box bg="gray.550" px="2em">
        <Text
          fontSize="xl"
          fontWeight="semibold"
          textAlign="center"
          color="white"
        >
          {title}
        </Text>
        {name === 'dashboard' && (
          <Text fontSize="md" textAlign="center" color="white">
            {description}
          </Text>
        )}
      </Box>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="50%"
            outerRadius="90%"
            paddingAngle={2}
            dataKey="value"
          >
            {data.map(({ name, strength }) => {
              return <Cell key={name} dataKey={name} fill={colors[strength]} />
            })}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <Stack align="center">
        {data.map(({ strength, percent, name }) => {
          if (!(name === 'web' && strength === 'moderate')) {
            // stop moderate badge from appearing on web donuts
            return (
              <Text
                color="white"
                key={`${name}:${strength}:${percent}`}
                px="1em"
                bg={strength}
                alignItems="center"
              >
                {name}: {percent}%
              </Text>
            )
          }
        })}
      </Stack>

      <br />

      {name === 'dashboard' && (
        <Stack isInline display="flex">
          {data.map(({ strength, categories }) => {
            return categories.map((category) => {
              return (
                <Text
                  flex="1"
                  key={`${name}:${strength}:${category}`}
                  color="black"
                  backgroundColor={strength}
                  rounded="md"
                  fontWeight="bold"
                >
                  {category.qty}
                  <br />
                  {category.name}
                </Text>
              )
            })
          })}
        </Stack>
      )}
    </Box>
  )
}

SummaryCard.propTypes = {
  name: string,
  title: string,
  description: string,
  data: array,
}
