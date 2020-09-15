import React from 'react'
import { object, arrayOf, number, string, func } from 'prop-types'
import { Box } from '@chakra-ui/core'
import { scaleOrdinal } from 'd3-scale'
import { useArcs } from './useArcs'
import { ZigZag, CrossHatch, Dots, Stripes } from './patterns'

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
    `url(#dots)`,
    color,
    `url(#stripes)`,
    `url(#crosshatch)`,
    `url(#zigzag)`,
  ])

  return (
    <div {...rest}>
      <svg height={height} width={width}>
        <title>{title}</title>
        <defs>
          <ZigZag width={0.4} background="#575766" color="#fff" />
          <Dots size={1} background="#575766" color="#fff" />
          <Stripes angle={45} background="#575766" color="#fff" />
          <CrossHatch width={0.8} background="#575766" color="#fff" />
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

      {arcs.map(({ title, count, percentage }, index) => {
        return (
          <Box key={`legend:${index}`} backgroundColor="primary">
            <svg
              height={30}
              width={30}
              style={{ display: 'inline', marginRight: '1em' }}
            >
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
