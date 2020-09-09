import React from 'react'
import { object, string, arrayOf, number } from 'prop-types'
import {
  max,
  range as d3Range,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  stack,
} from 'd3'
import * as d3 from 'd3'
import { data as chartdata } from './chartdata'
window.d3 = d3

const dmarc = chartdata.map((d) => ({
  month: `${d.month.slice(0, 3)}, ${d.year}`,
  ...d.categoryTotals,
}))

function Bar({ color = '#2e2e40', ...rest }) {
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

function YAxis({ domain, range, ...rest }) {
  const style = {
    stroke: '#2e2e40',
    strokeWidth: '1px',
  }

  const textStyle = {
    fontSize: '0.8em',
    fill: '#2e2e40',
    textAnchor: 'end',
  }

  const [start, end] = range

  const ticks = d3Range(start, end, end / domain.length)
  console.log({ ticks })

  return (
    <g {...rest}>
      <line x1={0} y1={start} y2={end} x2={0} style={style} />
      {ticks.map((tick, index) => (
        <g key={`y_labels:${index}`} transform={`translate(${-5},${56})`}>
          <text
            key={`yaxis:label:${index}`}
            style={textStyle}
            y={tick}
            x={0}
            fontFamily="Arial"
          >
            {domain[index]}
          </text>
          <line
            key={`yaxis:tick:${index}`}
            style={style}
            y1={tick}
            x1={0}
            y2={tick}
            x2={0}
          />
        </g>
      ))}
    </g>
  )
}

YAxis.propTypes = {
  range: arrayOf(number),
  domain: arrayOf(number),
}

function XAxis({
  domain = [],
  range,
  step,
  stroke = '#2e2e40',
  strokeWidth = '1px',
  ...rest
}) {
  const style = {
    stroke,
    strokeWidth,
  }

  const [start, end] = range

  const ticks = d3Range(start, end, step)

  return (
    <g {...rest}>
      <line x1={start} y1={0} x2={end} y2={0} style={style} />
      {ticks.map((tick, index) => (
        <g key={`xaxis:group:${index}`}>
          <line
            key={`xaxis:tick:${index}`}
            style={style}
            x1={tick + step / 2}
            y1={0}
            x2={tick + step / 2}
            y2={4}
          />
          <text
            key={`xaxis:label:${index}`}
            style={{ fill: '#2e2e40' }}
            x={tick}
            y={20}
            fontFamily="Arial"
            fontSize="10"
          >
            {domain[index]}
          </text>
        </g>
      ))}
    </g>
  )
}

XAxis.propTypes = {
  domain: arrayOf(string),
  range: arrayOf(number),
  stroke: string,
  strokeWidth: string,
  step: number,
}

export function BarChart({
  data = dmarc,
  width: w = 800,
  height: h = 500,
  title = 'Chart showing DMARC pass/fail summary',
  colors = ['#2E2E40', '#4F4F5E', '#70707C', '#92929B', '#B3B3B9'],
}) {
  const margin = { top: 0, right: 0, bottom: 100, left: 100 }

  const width = w - margin.left - margin.right
  const height = h - margin.top - margin.bottom

  const series = stack().keys([
    'fullPass',
    'passDkimOnly',
    'passSpfOnly',
    'fail',
  ])(data)

  console.log('series', series)

  const y = scaleLinear()
    .domain([0, max(series, (d) => max(d, (d) => d[1]))])
    .range([margin.bottom, height])

  const months = data.map((d) => d.month)

  const x = scaleBand().domain(months).range([0, width])

  const color = scaleOrdinal()
    .domain(series.map((d) => d.key))
    .range(colors)

  return (
    <svg width={w} height={h}>
      <title>{title}</title>
      <YAxis
        transform={`translate(${margin.left},${0})`}
        domain={y.ticks().reverse()}
        range={[-margin.bottom, height]}
      />

      <g
        className="chart"
        transform={`translate(${margin.left},${h}) scale(1, -1)`}
      >
        {series.map((individualSeries) => {
          console.log('individualSeries', individualSeries)
          return individualSeries.map((datum, index) => {
            console.log({ datum })
            return (
              <Bar
                key={index}
                x={x(datum.data.month)}
                y={y(datum[0])}
                width={x.bandwidth()}
                height={y(datum[1]) - y(datum[0])}
                color={color(individualSeries.key)}
              />
            )
          })
        })}
      </g>
      <XAxis
        transform={`translate(${0},${height})`}
        step={x.bandwidth()}
        domain={months}
        range={[margin.left, width]}
      />
      <text
        transform={`translate(${50}, ${height /2}) rotate(-90)`}
        style={{ fill: '#2e2e40' }}
        x={0}
        y={0}
        fontFamily="Arial"
        fontSize="20"
      >
        Emails
      </text>
      <text
        transform={`translate(${width / 2}, ${450}) rotate(0)`}
        style={{ fill: '#2e2e40' }}
        x={0}
        y={0}
        fontFamily="Arial"
        fontSize="20"
      >
        Months
      </text>
    </svg>
  )
}

BarChart.propTypes = {
  height: number,
  width: number,
  title: string,
  data: arrayOf(object),
  colors: arrayOf(object),
}
