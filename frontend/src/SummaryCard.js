import React from 'react'
import { Text, Stack, Box, Badge, Divider } from '@chakra-ui/core'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { string, array } from 'prop-types'

export function SummaryCard({ ...props }) {
  const { title, description } = props

  const data = [
    {
      strength: 'strong',
      name: 'Pass',
      categories: [
        {
          name: 'pass_conditon',
          qty: Math.floor(Math.random() * 1000 + 1),
        },
      ],
    },
    {
      strength: 'moderate',
      name: 'Partial pass',
      categories: [
        {
          name: 'partial_pass1',
          qty: Math.floor(Math.random() * 150 + 1),
        },
        {
          name: 'partial_pass2',
          qty: Math.floor(Math.random() * 150 + 1),
        },
      ],
    },
    {
      strength: 'weak',
      name: 'All fail',
      categories: [
        {
          name: 'fail1',
          qty: Math.floor(Math.random() * 100 + 1),
        },
        {
          name: 'fail2',
          qty: Math.floor(Math.random() * 100 + 1),
        },
        {
          name: 'fail3',
          qty: Math.floor(Math.random() * 100 + 1),
        },
      ],
    },
    {
      strength: 'unknown',
      name: 'Unknown',
      categories: [
        { name: 'unknown', qty: Math.floor(Math.random() * 100 + 1) },
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
      <Box
        w="300px"
        rounded="lg"
        bg="#EDEDED"
        overflow="hidden"
        borderColor="black"
        borderWidth="1"
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

        <ResponsiveContainer width="100%" height={250}>
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
                return (
                  <Cell key={entry.name} dataKey={entry.name} fill={color} />
                )
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
              <Badge
                key={entry.name}
                variantColor={color}
                variant="solid"
                alignItems="center"
              >
                <Text alignItems="center" mx="auto">
                  {entry.name}: {entry.percent}%
                </Text>
              </Badge>
            )
          })}
        </Stack>

        <br />

        {/* data box */}
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
                  <Stack align="center" isInline key={category.name}>
                    <Text
                      p="1"
                      color="#EDEDED"
                      backgroundColor={color}
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
      </Box>
    </Box>
  )
}

SummaryCard.propTypes = {
  title: string,
  description: string,
  data: array,
}
