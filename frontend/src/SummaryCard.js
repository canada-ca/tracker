import React, { useEffect, useRef } from 'react'
import { Text, Stack, Box, Badge } from '@chakra-ui/core'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { string, object, bool } from 'prop-types'
import WithPseudoBox from './withPseudoBox'

/* scheme for const data:
  strength options: 'strong', 'moderate', 'weak'. Omitted strengths are ignored
  {
    categoryTotals: {
      property: value,
      property: value,
      ...,
      total: value,
    },
    strengths: {
      strong: {
        name: Name to appear on badge
        types: [
          "property from category totals that are 'strong' ",
          "property from category totals that are 'strong' ",
        ]
      },
      moderate: {same as strong},
      weak: {same as strong},
    }
  }
 */

function SummaryCard({ ...props }) {
  const { title, description, data, slider } = props

  // Find total and percentage for each strength category
  Object.values(data.strengths).forEach((strength) => {
    strength.value = 0
    strength.types.forEach((type) => {
      if (Object.keys(data.categoryTotals).includes(type))
        strength.value += data.categoryTotals[type]
    })
    strength.percent =
      Math.round((strength.value / data.categoryTotals.total) * 100 * 10) / 10
  })

  // This block will allow the donut to be as large as possible
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
              data={Object.values(data.strengths)}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="90%"
              paddingAngle={2}
              dataKey="value"
            >
              {/* Generate cells for doughnut*/}
              {Object.entries(data.strengths).map(([key, _value]) => {
                let color
                switch (key) {
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
                return <Cell dataKey={key} fill={color} />
              })}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        {/* Generate badges */}
        {Object.entries(data.strengths).map(([key, value]) => {
          let color
          switch (key) {
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
                {value.name}: {value.percent}%
              </Text>
            </Badge>
          )
        })}

        {/* Give empty room at bottom of card if no slider */}
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
  data: object.isRequired,
  slider: bool,
}

export default WithPseudoBox(SummaryCard)
