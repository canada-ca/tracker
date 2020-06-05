import React from 'react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Text, Stack, Box, Badge, Divider } from '@chakra-ui/core'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { string, array } from 'prop-types'

export function SummaryCard({ ...props }) {
  const { name, title, description } = props
  const { i18n } = useLingui()

  // randomized data used to populate charts before API is connected
  const data = [
    {
      strength: 'strong',
      name: name === 'web' ? i18n._(t`Enforced`) : i18n._(t`Fully Implemented`),
      categories: [
        {
          name: 'pass_conditon',
          qty: Math.floor(Math.random() * 1000 + 1),
        },
      ],
    },
    {
      strength: 'moderate',
      name: i18n._(t`Partially Implemented`),
      categories: [
        {
          name: 'partial_pass',
          qty: name === 'web' ? null : Math.floor(Math.random() * 300 + 1),
        },
      ],
    },
    {
      strength: 'weak',
      name:
        name === 'web' ? i18n._(t`Not Enforced`) : i18n._(t`Not Implemented`),
      categories: [
        {
          name: 'fail_condition',
          qty: Math.floor(Math.random() * 300 + 1),
        },
      ],
    },
  ]

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
    <Box>
      <Box w="430px" rounded="lg" bg="#EDEDED" overflow="hidden">
        <Box bg="#444444">
          <Text
            fontSize="xl"
            fontWeight="semibold"
            textAlign={['center']}
            color="#EDEDED"
          >
            {title}
          </Text>
          {name === 'dashboard' && (
            <Text fontSize="md" textAlign={['center']} color="#EDEDED">
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
            if (!(name === 'web' && entry.strength === 'moderate')) {
              // stop moderate badge from appearing on web donuts
              return (
                <Badge variantColor={color} variant="solid" alignItems="center">
                  <Text alignItems="center" mx="auto">
                    {entry.name}: {entry.percent}%
                  </Text>
                </Badge>
              )
            }
          })}
        </Stack>

        <br />

        {name === 'dashboard' && (
          <Box bg="#444444">
            <Box h="1" />
            <Stack
              isInline
              gridTemplateColumns="10"
              gridTemplateRows="150"
              // overflowX="scroll"
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
                        backgroundColor={color}
                        rounded="md"
                        textAlign="center"
                        as="b"
                      >
                        {category.qty}
                        <br />
                        {`${category.name}`}
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
    </Box>
  )
}

SummaryCard.propTypes = {
  name: string,
  title: string,
  description: string,
  data: array,
}
