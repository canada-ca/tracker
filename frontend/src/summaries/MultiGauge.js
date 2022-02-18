import React from 'react'
import * as d3 from 'd3'
import { Box, Image, Text } from '@chakra-ui/react'
import trackerLogo from '../images/tracker_v-03.png'

export function MultiGauge() {
  const width = 960
  const height = 500
  const chartRadius = height / 2 - 40
  const PI = Math.PI
  const arcMinRadius = 100
  const arcPadding = 5

  const color = d3.scaleOrdinal(d3.schemeCategory10)

  const data = [
    {
      name: 'Not Implemented',
      value: 731,
    },
    {
      name: 'Assess',
      value: 117,
    },
    {
      name: 'Deploy',
      value: 1796,
    },
    {
      name: 'Enforce',
      value: 1177,
    },
    {
      name: 'Maintain',
      value: 683,
    },
  ]

  // let domainCount = 0
  // data.forEach(({ value }) => {
  //   domainCount += value
  // })

  // const total = <Text fontWeight="bold">Total: {domainCount}</Text>
  // const logo = <Image src={trackerLogo} alt={'Tracker Logo'} />

  const svg = d3
    .select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
    .style('margin', '0px auto')
    .style('display', 'block')
    .style('font', '12px sans-serif')

  // const tooltip = d3
  //   .select('body')
  //   .append('div')
  //   .style('position', 'absolute')
  //   .style('display', 'none')
  //   .style('background', 'rgba(0,0,0,0.6)')
  //   .style('border-radius', '3px')
  //   .style('box-shadow', '-3px 3px 15px #888')
  //   .style('color', 'white')
  //   .style('padding', '6px')

  // const center = d3
  //   .select('body')
  //   .append('div')
  //   .attr('width', width / 2)
  //   .attr('height', height / 2)

  // center

  const scale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) * 1.1])
    .range([0, 2 * PI])

  const keys = data.map((d, _i) => d.name)
  // number of arcs
  const numArcs = keys.length
  const arcWidth = (chartRadius - arcMinRadius - numArcs * arcPadding) / numArcs

  const arc = d3
    .arc()
    .innerRadius((_d, i) => getInnerRadius(i))
    .outerRadius((_d, i) => getOuterRadius(i))
    .startAngle(0)
    .endAngle((d, _i) => scale(d))

  // data arcs
  const arcs = svg
    .append('g')
    .attr('class', 'data')
    .selectAll('path')
    .data(data)
    .enter()
    .append('path')
    .attr('class', 'arc')
    .style('fill', (_d, i) => color(i))
    .style('opacity:', 0.9)
    .style('transition', 'opacity 0.5s')

  arcs
    .transition()
    .delay((_d, i) => i * 200)
    .duration(1000)
    .attrTween('d', arcTween)

  // arcs.on('mousemove', showTooltip)
  // arcs.on('mouseout', hideTooltip)

  function arcTween(d, i) {
    const interpolate = d3.interpolate(0, d.value)
    return (t) => arc(interpolate(t), i)
  }

  // function showTooltip(e, d) {
  //   const [x, y] = d3.pointer(e)
  //   tooltip
  //     .style('left', x + 10 + 'px')
  //     .style('top', y - 25 + 'px')
  //     .style('display', 'inline-block')
  //     .html(d.value)
  // }

  // function hideTooltip() {
  //   tooltip.style('display', 'none')
  // }

  function getInnerRadius(index) {
    return arcMinRadius + (numArcs - (index + 1)) * (arcWidth + arcPadding)
  }

  function getOuterRadius(index) {
    return getInnerRadius(index) + arcWidth
  }

  return <Box>{arcs}</Box>
}
