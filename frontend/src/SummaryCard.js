import React from 'react'
import { Text, Stack, Box, Badge, Divider } from '@chakra-ui/core'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { string, array, bool } from 'prop-types'
import WithPseudoBox from './withPseudoBox'

function SummaryCard({ ...props }) {
  const { title, description, data, slider, pieDiameter } = props

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
    <Box
      rounded="lg"
      bg="#EDEDED"
      overflow="hidden"
      borderColor="black"
      borderWidth="1"
      width="min-content"
    >
      <Box bg="#444444">
        <Text
          fontSize="xl"
          fontWeight="semibold"
          textAlign={['center']}
          color="#EDEDED"
        >
          {title}
        </Text>
        <Text fontSize="md" textAlign={['center']} color="#EDEDED">
          {description}
        </Text>
      </Box>

      <ResponsiveContainer width={pieDiameter} height={pieDiameter}>
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
            {data.map((entry) => {
              let color
              switch (entry.strength) {
                case 'strong': {
                  color = '#2D8133'
                  break
                }
                case 'moderate': {
                  color = '#ffbf47'
                  break
                }
                case 'weak': {
                  color = '#e53e3e'
                  break
                }
                case 'unknown': {
                  color = 'grey'
                  break
                }
              }
              return <Cell dataKey={entry.name} fill={color} />
            })}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <Stack align="center">
        {data.map((entry) => {
          let color
          switch (entry.strength) {
            case 'strong':
              color = 'green'
              break
            case 'moderate':
              color = 'yellow'
              break
            case 'weak':
              color = 'red'
              break
            case 'unknown':
              color = 'gray'
              break
          }
          return (
            <Badge variantColor={color} variant="solid" alignItems="center">
              <Text alignItems="center" mx="auto">
                {entry.name}: {entry.percent}%
              </Text>
            </Badge>
          )
        })}
      </Stack>

      <br />

      {/* data box */}
      {slider && (
        <Box bg="#444444">
          <Box h="1" />
          <Stack
            isInline
            gridTemplateColumns="10"
            gridTemplateRows="150"
            overflowX="scroll"
            gridAutoFlow="columns"
            gridAutoColumns="40%"
          >
            <Box />
            {data.map((entry) => {
              let color
              switch (entry.strength) {
                case 'strong':
                  color = '#2D8133'
                  break
                case 'moderate':
                  color = '#ffbf47'
                  break
                case 'weak':
                  color = '#e53e3e'
                  break
                case 'unknown':
                  color = '#B0B0B0'
                  break
              }
              return entry.categories.map((category) => {
                return (
                  <Stack align="center" isInline>
                    <Text
                      p="1"
                      color="#EDEDED"
                      rounded="md"
                      textAlign="center"
                      as="b"
                    >
                      {`${category.name}: `}
                      <br />
                      {category.qty}
                    </Text>
                    <Divider orientation="vertical" borderColor="red.500" />
                  </Stack>
                )
              })
            })}
          </Stack>
          <Box h="1" />
        </Box>
      )}
    </Box>
  )
}

SummaryCard.propTypes = {
  title: string.isRequired,
  description: string.isRequired,
  data: array.isRequired,
  slider: bool,
}

export default WithPseudoBox(SummaryCard)
