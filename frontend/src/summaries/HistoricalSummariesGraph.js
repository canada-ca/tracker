import React, { useCallback } from 'react'
import { Box, Text } from '@chakra-ui/react'
import { number, object } from 'prop-types'
import { extent, bisector } from 'd3-array'

import { AxisLeft, AxisBottom } from '@visx/axis'
import { LinearGradient } from '@visx/gradient'
import { GridRows, GridColumns } from '@visx/grid'
import { Group } from '@visx/group'
import { localPoint } from '@visx/event'
import { scaleLinear } from '@visx/scale'
import { Line, LinePath } from '@visx/shape'
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip'
import { timeFormat } from '@visx/vendor/d3-time-format'

const getDate = ({ date }) => new Date(date)

export function HistoricalSummariesGraph({ data, width = 1200, height = 500 }) {
  let summaries = []
  data?.edges?.forEach(({ node }) => {
    const { date, https, dmarc } = node
    const httpsNode = { date, type: 'HTTPS', score: https.categories[0].percentage.toFixed(1) }
    const dmarcNode = { date, type: 'DMARC', score: dmarc.categories[0].percentage.toFixed(1) }

    summaries.push(httpsNode)
    summaries.push(dmarcNode)
  })
  summaries.sort((a, b) => getDate(a) - getDate(b))

  // tooltip parameters
  const { tooltipData, tooltipLeft = 0, tooltipTop = 0, showTooltip, hideTooltip } = useTooltip()

  // define margins from where to start drawing the chart
  const margin = { top: 40, right: 40, bottom: 40, left: 40 }

  // defining inner measurements
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  // data for lines
  const httpsData = summaries.filter(({ type }) => {
    return type === 'HTTPS'
  })
  const dmarcData = summaries.filter(({ type }) => {
    return type === 'DMARC'
  })
  const series = [dmarcData, httpsData]

  //colors for lines
  const colors = ['#43b284', '#fab255']

  // Defining selector functions
  const getRD = ({ score }) => score
  const bisectDate = bisector(({ date }) => new Date(date)).left

  // get data from a date
  const getD = (date) => {
    const output = summaries.filter((el) => {
      return el.date === date
    })
    return output
  }

  // to remove comma from date
  const formatDate = timeFormat("%b %d, '%y")

  // horizontal, x scale
  const timeScale = scaleLinear({
    range: [0, innerWidth],
    domain: extent(summaries, getDate),
    nice: true,
  })

  // vertical, y scale
  const rdScale = scaleLinear({
    range: [innerHeight, 0],
    domain: [0, 101],
    nice: true,
  })

  // defining tooltip styles
  const tooltipStyles = {
    ...defaultStyles,
    minWidth: 60,
    backgroundColor: 'rgba(0,0,0,0.9)',
    color: 'white',
  }

  const handleTooltip = useCallback((e) => {
    const { x } = localPoint(e) || { x: 0 }
    const x0 = timeScale.invert(x - margin.left) // get Date from the scale

    const index = bisectDate(summaries, x0, 1)
    const d0 = summaries[index - 1]
    const d1 = summaries[index]
    let d = d0

    if (d1 && getDate(d1)) {
      d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0
    }
    showTooltip({
      tooltipData: getD(d.date),
      tooltipLeft: x,
      tooltipTop: rdScale(getRD(d)),
    })
  })

  return (
    <Box position="relative">
      <svg width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} fill={'#24242c'} rx={14} />
        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={rdScale}
            width={innerWidth}
            height={innerHeight - margin.top}
            stroke="#EDF2F7"
            strokeOpacity={0.2}
          />
          <GridColumns scale={timeScale} width={innerWidth} height={innerHeight} stroke="#EDF2F7" strokeOpacity={0.2} />
          <LinearGradient id="area-gradient" from={'#43b284'} to={'#43b284'} toOpacity={0.1} />
          <AxisLeft
            tickTextFill={'#EDF2F7'}
            stroke={'#EDF2F7'}
            tickStroke={'#EDF2F7'}
            scale={rdScale}
            tickLabelProps={() => ({
              fill: '#EDF2F7',
              fontSize: 11,
              textAnchor: 'end',
            })}
          />
          <AxisBottom
            scale={timeScale}
            stroke={'#EDF2F7'}
            tickFormat={formatDate}
            tickStroke={'#EDF2F7'}
            tickTextFill={'#EDF2F7'}
            top={innerHeight}
            tickLabelProps={() => ({
              fill: '#EDF2F7',
              fontSize: 11,
              textAnchor: 'middle',
            })}
          />
          {series.map((sData, i) => (
            <LinePath
              key={i}
              stroke={colors[i]}
              strokeWidth={3}
              data={sData}
              x={(d) => timeScale(getDate(d)) ?? 0}
              y={(d) => rdScale(getRD(d)) ?? 0}
            />
          ))}
          {tooltipData && (
            <g>
              <Line
                from={{ x: tooltipLeft - margin.left, y: 0 }}
                to={{ x: tooltipLeft - margin.left, y: innerHeight }}
                stroke={'#EDF2F7'}
                strokeWidth={2}
                pointerEvents="none"
                strokeDasharray="4,2"
              />
            </g>
          )}
          <rect
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            onTouchStart={handleTooltip}
            fill={'transparent'}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />
        </Group>
      </svg>
      {tooltipData && (
        <TooltipWithBounds key={Math.random()} top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
          <Text color="#fab255">{`HTTPS: ${getRD(tooltipData[0])}%`}</Text>
          <Text color="#43b284">{`DMARC: ${getRD(tooltipData[1])}%`}</Text>
          <Text color="white">{`Date: ${formatDate(getDate(tooltipData[0]))}`}</Text>
        </TooltipWithBounds>
      )}
    </Box>
  )
}

HistoricalSummariesGraph.propTypes = {
  data: object.isRequired,
  width: number.isRequired,
  height: number.isRequired,
}
