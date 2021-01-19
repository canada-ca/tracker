import React from 'react'
import { object, arrayOf, number, string, func } from 'prop-types'
import { Box, Image, Text } from '@chakra-ui/core'
import { scaleOrdinal } from 'd3'
import { Trans } from "@lingui/macro"
import { useArcs } from './useArcs'
import { ZigZag, CrossHatch, Dots, Stripes } from './patterns'
import trackerLogo from './images/tracker_v-03.png'

export const Doughnut = ({
  data,
  color,
  height,
  width,
  title,
  valueAccessor = (d) => d,
  innerRadius = Math.ceil(width / 3.5),
  outerRadius = Math.ceil(width / 2.2),
  padAngle = 0.05,
  children,
  ...rest
}) => {
  const arcs = useArcs({
    innerRadius,
    outerRadius,
    padAngle,
    data,
    valueAccessor,
  })

  const patterns = scaleOrdinal().range([
    color,
    `url(#stripes)`,
    `url(#dots)`,
    `url(#crosshatch)`,
    `url(#zigzag)`,
  ])

  const doughnutChart = (
    <svg height={height} width={width}>
      <title>{title}</title>
      <defs>
        <ZigZag width={0.4} background="#F16D22" color="#fff" />
        <Dots size={1} background="#B93B26" color="#fff" />
        <Stripes angle={45} background="#F8991F" color="#fff" />
        <CrossHatch width={0.8} background="#F16D22" color="#fff" />
      </defs>
      <g transform={`translate(${width / 2},${height / 2})`}>
        {arcs.map((arc, index) => {
          return children(
            { d: arc.d, fill: patterns(index / data.length - 1) },
            index,
          )
        })}
      </g>
    </svg>
  )

  const noScanMessage = (
    <Box>
      <Image src={trackerLogo} alt={'Tracker Logo'} />
      <Text fontSize="l" textAlign="center" color="black">
        <Trans>No scan data for this organization.</Trans>
      </Text>
    </Box>
  )

  let chartContent
  if (data[0].total) {
    chartContent = doughnutChart
  } else {
    chartContent = noScanMessage
  }

  return (
    <div {...rest}>
      {chartContent}
      {arcs.map(({ title, count, percentage }, index) => {
        if (percentage % 1 >= 0.5) {
          percentage = Math.ceil(percentage)
        } else {
          percentage = Math.floor(percentage)
        }
        return (
          <Box
            key={`legend:${index}`}
            backgroundColor="primary"
            px="2"
            py={arcs.length > 2 ? '2' : '5'}
            mx="auto"
            overflow="hidden"
          >
            <svg
              height={30}
              width={30}
              style={{ display: 'inline', marginRight: '1em' }}
            >
              <defs>
                <ZigZag width={0.4} background="#F16D22" color="#fff" />
                <Dots size={1} background="#B93B26" color="#fff" />
                <Stripes angle={45} background="#F8991F" color="#fff" />
                <CrossHatch width={0.8} background="#F16D22" color="#fff" />
              </defs>
              <g>
                <rect
                  stroke="#fff"
                  strokeWidth="2"
                  width="30"
                  height="30"
                  fill={patterns(index / data.length - 1)}
                />
              </g>
            </svg>
            <p
              style={{
                color: '#fff',
                fontWeight: 'bold',
                backgroundColor: '#2e2e40',
                display: 'inline',
              }}
            >
              {`${title}: ${count} - ${percentage}% `}
            </p>
          </Box>
        )
      })}
    </div>
  )
}

Doughnut.propTypes = {
  data: arrayOf(object),
  title: string,
  color: string,
  children: func,
  height: number,
  width: number,
  innerRadius: number,
  outerRadius: number,
  padAngle: number,
  valueAccessor: func,
}

export const Segment = ({ d, fill, ...rest }) => {
  return <path d={d} fill={fill} {...rest} />
}

Segment.propTypes = {
  fill: string,
  d: string,
}
