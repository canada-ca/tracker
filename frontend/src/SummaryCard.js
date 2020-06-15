import React, { useEffect, useRef } from 'react'
import { Text, Stack, Box } from '@chakra-ui/core'
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

  // Generate cells for the doughnut to be added to the JSX
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

  const compareStrengths = (a, b) =>
    a[1].value < b[1].value ? 1 : b[1].value < a[1].value ? -1 : 0

  // Generate badges for the card to be used in the JSX
  const badges = (
    <Stack align="center" spacing={0}>
      {Object.entries(data.strengths)
        .sort(compareStrengths)
        .map(([strengthKey, strengthValues]) => {
          return (
            <Text
              key={`${title}:Badge:${strengthKey}`}
              color="white"
              px="0.5em"
              bg={strengthKey}
              fontWeight="bold"
              fontSize="sm"
              width="100%"
              textAlign="center"
            >
              {`${
                strengthValues.name
              }: ${strengthValues.value.toLocaleString()} - ${strengthValues.percent}% `}
            </Text>
          )
        })}
    </Stack>
  )

  const boxShadow = `0.4em 0.4em 0.3em ${colors.gray[300]}`

  return (
    <Box
      bg="white"
      rounded="lg"
      overflow="hidden"
      ref={ref}
      boxShadow={boxShadow}
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
              data={Object.values(data.strengths)}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="90%"
              dataKey="value"
            >
              {doughnutCells}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        {badges}
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
