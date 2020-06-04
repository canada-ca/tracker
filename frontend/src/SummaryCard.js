import React, { useEffect, useRef } from 'react'
import { Text, Stack, Box, Badge } from '@chakra-ui/core'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { string, array, bool, number } from 'prop-types'
import WithPseudoBox from './withPseudoBox'

function SummaryCard({ ...props }) {
  const { title, description, data, slider } = props

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

  const ref = useRef(null)

  const [parentWidth, setParentWidth] = React.useState(0)

  useEffect(() => {
    if (ref.current) {
      setParentWidth(ref.current.offsetWidth)
    }
  }, [ref, setParentWidth])

  return (
    <Box bg="#EDEDED" rounded="lg" overflow="hidden" ref={ref}>
      <Stack>
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

        <ResponsiveContainer width="100%" height={parentWidth}>
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
              variantColor={color}
              variant="solid"
              alignItems="center"
              width="min-content"
              mx="auto"
            >
              <Text alignItems="center">
                {entry.name}: {entry.percent}%
              </Text>
            </Badge>
          )
        })}

        {!slider && <br />}

        {/* data box */}
        {slider && (
          <Box bg="#444444">
            <Stack isInline overflowX="auto">
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
                    <Text
                      color="#EDEDED"
                      rounded="md"
                      textAlign="center"
                      as="b"
                      fontSize="xs"
                    >
                      {`${category.name}`}
                      <br />
                      {category.qty}
                    </Text>
                  )
                })
              })}
            </Stack>
          </Box>
        )}
      </Stack>
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
