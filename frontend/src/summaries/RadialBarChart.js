import React from 'react'
import * as d3 from 'd3'
import { arrayOf, number, object } from 'prop-types'
import theme from '../theme/canada'
import { t } from '@lingui/macro'
import { useD3 } from '../utilities/useD3'
import { Box } from '@chakra-ui/react'

export function RadialBarChart({ data, height = 500, width = 600 }) {
  const ref = useD3(
    (svg) => {
      const chartRadius = height / 2 - 40
      const PI = Math.PI
      const arcMinRadius = 80
      const arcPadding = 10
      const maxPercentage = 0.75
      const labelPadding = -260

      const { colors } = theme
      const color = d3
        .scaleOrdinal()
        .range(['#22485B', '#675292', '#A15196', '#D45087', '#F15E6B'])

      const categoryDisplay = {
        'not implemented': { name: t`0. Not Implemented`, color: colors.weak },
        assess: {
          name: t`1. Assess`,
          color: colors.weak,
        },
        deploy: {
          name: t`2. Deploy`,
          color: colors.moderateAlt,
        },
        enforce: {
          name: t`3. Enforce`,
          color: colors.moderate,
        },
        maintain: {
          name: t`4. Maintain`,
          color: colors.strong,
        },
        unscanned: {
          name: t`Unscanned`,
          color: colors.gray['400'],
        },
      }

      let domainCount = 0
      data.forEach(({ count }) => {
        domainCount += count
      })

      svg.attr('width', width).attr('height', height).append('g')

      const scale = d3
        .scaleLinear()
        .domain([0, domainCount])
        .range([0, 2 * PI])

      const keys = data.map((d, _i) => d.name)
      // number of arcs
      const numArcs = keys.length
      const arcWidth =
        (chartRadius - arcMinRadius - numArcs * arcPadding) / numArcs

      const radialAxis = svg
        .append('g')
        .selectAll('g')
        .data(data)
        .enter()
        .append('g')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

      radialAxis
        .append('text')
        .attr('x', labelPadding)
        .attr('y', (_d, i) => -getOuterRadius(i) + arcPadding + 2)
        .text(
          (d) =>
            `${categoryDisplay[d.name].name}: ${
              d.count
            } - ${d.percentage.toFixed(2)}%`,
        )

      // grey data paths
      const path = d3
        .arc()
        .innerRadius((_d, i) => getInnerRadius(i))
        .outerRadius((_d, i) => getOuterRadius(i))
        .startAngle(0)
        .endAngle((_d, _i) => scale(domainCount * maxPercentage))
        .cornerRadius(20)

      const paths = svg
        .append('g')
        .selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .style('fill', '#EAEAEA')
        .style('opacity:', 0.9)
        .style('transition', 'opacity 0.5s')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

      paths
        .transition()
        .delay((_d, i) => i * 0)
        .duration(0)
        .attrTween('d', pathTween)

      // data arcs
      const arc = d3
        .arc()
        .innerRadius((_d, i) => getInnerRadius(i))
        .outerRadius((_d, i) => getOuterRadius(i))
        .startAngle(0)
        .endAngle((d, _i) => scale(d * maxPercentage))
        .cornerRadius(20)

      const arcs = svg
        .append('g')
        .selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .style('fill', (_d, i) => color(i))
        .style('opacity:', 0.9)
        .style('transition', 'opacity 0.5s')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

      arcs
        .transition()
        .delay((_d, i) => i * 200)
        .duration(1000)
        .attrTween('d', arcTween)

      // Center text
      svg
        .append('text')
        .attr('x', 0)
        .attr('y', -15)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .text(`${domainCount}`)
        .style('font-size', '40px')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

      svg
        .append('text')
        .attr('x', 0)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .text(`Domains`)
        .style('font-size', '20px')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

      function arcTween(d, i) {
        const interpolate = d3.interpolate(0, d.count)
        return (t) => arc(interpolate(t), i)
      }

      function pathTween(_d, i) {
        const interpolate = d3.interpolate(0, domainCount)
        return (t) => path(interpolate(t), i)
      }

      function getInnerRadius(index) {
        return arcMinRadius + (numArcs - (index + 1)) * (arcWidth + arcPadding)
      }

      function getOuterRadius(index) {
        return getInnerRadius(index) + arcWidth
      }
    },
    [data.length],
  )

  return (
    <Box
      align="center"
      justifyContent="center"
      borderWidth="1"
      borderColor="primary"
    >
      <svg ref={ref} />
    </Box>
  )
}

RadialBarChart.propTypes = {
  height: number,
  width: number,
  data: arrayOf(object),
}
