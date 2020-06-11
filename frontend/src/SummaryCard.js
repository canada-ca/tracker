import React, { useEffect, useRef } from 'react'
import { Text, Stack, Box, Badge } from '@chakra-ui/core'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { string, object, bool } from 'prop-types'
import WithPseudoBox from './withPseudoBox'
import theme from './theme/canada'

const { colors } = theme

/*
scheme for const data:
**strength options: 'strong', 'moderate', 'weak'. Omitted strengths are ignored
  {
    categoryTotals: {
      property: INT,
      property: INT,
      ...,
      total: value,
    },
    strengths: {
      strong: {
        name: "Name to appear on badge"
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

  const excludeFromTotal = ['total', '__typename']
  // Calculate total of all properties in categoryTotals
  const totalForCategories = Object.entries(data.categoryTotals)
    .filter((category) => !excludeFromTotal.includes(category[0]))
    .map((category) => category[1])
    .reduce((categoryValue, currentTotal) => {
      return categoryValue + currentTotal
    })

  // Find total and percentage for each strength category
  Object.values(data.strengths).forEach((strength) => {
    strength.value = 0
    strength.types.forEach((type) => {
      if (Object.keys(data.categoryTotals).includes(type))
        strength.value += data.categoryTotals[type]
    })
    strength.percent =
      Math.round((strength.value / totalForCategories) * 100 * 10) / 10
  })

  // This block will allow the donut to be as large as possible
  const ref = useRef(null)
  const [parentWidth, setParentWidth] = React.useState(0)
  useEffect(() => {
    if (ref.current) {
      setParentWidth(ref.current.offsetWidth)
    }
  }, [ref, setParentWidth])

  // Generate cells for the doughtnut to be added to the JSX
  const doughnutCells = Object.entries(data.strengths).map(
    ([strengthKey, _value]) => {
      return (
        <Cell
          key={`${title}:DoughnutCell:${strengthKey}`}
          fill={colors[strengthKey]}
        />
      )
    },
  )

  // Generate badges for the card to be used in the JSX
  const badges = Object.entries(data.strengths).map(([strengthKey, value]) => {
    return (
      <Text
        key={`${title}:Badge:${strengthKey}`}
        color="white"
        alignItems="center"
        px="1em"
        bg={strengthKey}
        rounded="md"
      >
        {value.name}: {value.percent}%
      </Text>
    )
  })

  const sliderRow = slider && (
    <Box bg="#444444">
      <Stack isInline overflowX="auto">
        {Object.entries(data.strengths).map(([key, value]) => {
          let color
          switch (key) {
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
              color = 'gray'
              break
          }
          return value.types.map((type) => {
            return (
              <Text
                key={`${title}:Slider:${type}`}
                color="#EDEDED"
                rounded="md"
                textAlign="center"
                as="b"
                fontSize="xs"
                bg={color}
              >
                {type}
                <br />
                {data.categoryTotals[type]}
              </Text>
            )
          })
        })}
      </Stack>
    </Box>
  )

  return (
    <Box bg="white" rounded="lg" overflow="hidden" ref={ref}>
      <Stack>
        <Box bg="gray.550" px="2em">
          <Text
            fontSize="xl"
            fontWeight="semibold"
            textAlign="center"
            color="white"
          >
            {title}
          </Text>
          <Text fontSize="md" textAlign="center" color="white">
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
              {doughnutCells}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <Stack align="center">{badges}</Stack>

        {/* Give empty room at bottom of card if no slider */}
        {!slider && <br />}

        {/* data box */}
        {slider && sliderRow}
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
