import React from 'react'
import { func, object, string, arrayOf, number } from 'prop-types'
import { Axis } from './Axis'
import { useStack } from './useStack'
import { useRange } from './useRange'
import { useLinearScale, useBandScale, useOrdinalScale } from './scales'
import theme from './theme/canada'
import { data as chartdata } from './chartdata'

function splitCamelCase(string) {
  return string
    .split(/(?=[A-Z])/)
    .map((s) => s.toLowerCase())
    .join(' ')
}

function Bar({ color = '#ccc', ...rest }) {
  const style = {
    fill: color,
  }

  return (
    <g>
      <rect className="bar" style={style} {...rest} />
    </g>
  )
}

Bar.propTypes = {
  color: string,
}

function Graph({ series: stack, children, ...rest }) {
  return (
    <g {...rest}>
      {stack.map((series) => {
        return series.map((datum, index) => {
          return children({ datum, key: series.key }, index)
        })
      })}
    </g>
  )
}

Graph.propTypes = {
  series: arrayOf(arrayOf(arrayOf(number))),
  children: func,
}

export function Chart({
  data,
  width: w = 800,
  height: h = 500,
  title,
  colors,
  keys,
}) {
  const margin = { top: 0, right: 0, bottom: 50, left: 100 }

  const width = w - margin.left - margin.right
  const height = h - margin.top - margin.bottom

  // create a series of series: 1 layer per key
  const { series, max } = useStack({
    data,
    offset: 'none',
    keys,
  })

  // map email volume to pixels, descending order
  const y = useLinearScale({ domain: [0, max], range: [height, 0] })

  const months = data.map((d) => d.month)

  // map months to pixels
  const x = useBandScale({ domain: months, range: [0, width] })

  // map keys to colors
  const color = useOrdinalScale({
    domain: keys,
    range: colors,
  })

  const xTicks = useRange({ start: 0, end: width, step: x.bandwidth() })

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <title>{title}</title>
      <g transform={`translate(${width /3.5}, ${height + 25})`}>
        {keys.map((key, index) => {
          const x = 130 * (index + 1)
          return (
            <g key={`legend:${key}:${index}`}>
              <rect
                style={{ fill: color(key), stroke: theme.colors.primary }}
                y={0}
                x={x}
                width={20}
                height={20}
              />
              <text
                key={`xaxis:label:${index}`}
                style={{ fill: theme.colors.primary }}
                y={15}
                x={x + 25}
                fontFamily="Arial"
                fontSize="12"
              >
                {splitCamelCase(key)}
              </text>
            </g>
          )
        })}
      </g>
      <g transform={`translate(${w / 10},0)`}>
        <Axis
          ticks={y.ticks().reverse()}
          label={() => (
            <text
              transform={`translate(${-45}, ${height}) rotate(-90)`}
              style={{ fill: '#2e2e40' }}
              x={0}
              y={0}
              fontFamily="Arial"
              fontSize="18"
            >
              Emails
            </text>
          )}
          border={() => (
            <line
              x1={0}
              y1={y.range()[0]}
              y2={y.range()[1]}
              x2={0}
              style={{ stroke: '#2e2e40', strokeWidth: '1px' }}
            />
          )}
        >
          {(tick, index) => {
            const scaled = y(tick)
            return (
              <g key={`ylabels:${index}`}>
                <text
                  key={`yaxis:label:${index}`}
                  style={{
                    fontSize: '0.8em',
                    fill: '#2e2e40',
                    textAnchor: 'end',
                  }}
                  y={scaled + 4}
                  x={-5}
                  fontFamily="Arial"
                >
                  {tick}
                </text>
                <line
                  key={`yaxis:tick:${index}`}
                  style={{ stroke: '#2e2e40', strokeWidth: '1px' }}
                  y1={scaled}
                  x1={0}
                  y2={scaled}
                  x2={-4}
                />
              </g>
            )
          }}
        </Axis>

        <Graph series={series}>
          {({ datum, key }, index) => {
            const [lower, upper] = datum
            return (
              <Bar
                key={index}
                x={x(datum.data.month)}
                y={y(upper)}
                width={x.bandwidth()}
                height={y(lower) - y(upper)}
                color={color(key)}
              />
            )
          }}
        </Graph>

        <Axis
          transform={`translate(${0},${height})`}
          ticks={xTicks}
          label={() => (
            <text
              style={{ fill: theme.colors.primary }}
              x={0}
              y={40}
              fontFamily="Arial"
              fontSize="18"
            >
              Months
            </text>
          )}
          border={() => (
            <line
              x1={x.range()[0]}
              y1={0}
              x2={x.range()[1]}
              y2={0}
              style={{ stroke: theme.colors.primary, strokeWidth: '1px' }}
            />
          )}
        >
          {(tick, index) => {
            return (
              <g key={`xaxis:group:${index}`}>
                <line
                  key={`xaxis:tick:${index}`}
                  style={{ stroke: theme.colors.primary, strokeWidth: '1px' }}
                  x1={tick + x.bandwidth() / 2}
                  y1={0}
                  x2={tick + x.bandwidth() / 2}
                  y2={4}
                />
                <text
                  key={`xaxis:label:${index}`}
                  style={{ fill: theme.colors.primary }}
                  x={tick}
                  y={20}
                  fontFamily="Arial"
                  fontSize="10"
                >
                  {x.domain()[index]}
                </text>
              </g>
            )
          }}
        </Axis>
      </g>
    </svg>
  )
}

Chart.propTypes = {
  height: number,
  width: number,
  title: string,
  data: arrayOf(object),
  colors: arrayOf(string),
  keys: arrayOf(string),
}

export function BarChart() {
  const months = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  }

  const dmarc = chartdata
    // sort by date: oldest to newest
    .sort((a, b) => {
      return (
        new Date(a.year, months[a.month], 0) -
        new Date(b.year, months[b.month], 0)
      )
    })
    .map((d) => {
      return {
        month: `${d.month.slice(0, 3)}, ${d.year}`,
        ...d.categoryTotals,
      }
    })

  return (
    <Chart
      data={dmarc}
      width={900}
      height={350}
      title="Chart showing DMARC pass/fail summary"
      colors={[
        theme.colors.primary,
        '#4F4F5E',
        '#70707C',
        '#92929B',
        '#B3B3B9',
      ]}
      keys={['fullPass', 'passDkimOnly', 'passSpfOnly', 'fail']}
    />
  )
}
