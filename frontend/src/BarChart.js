import React from 'react'
import { object, string, arrayOf, number } from 'prop-types'
import { max, range, scaleBand, scaleLinear, scaleOrdinal, stack } from 'd3'
import { data as chartdata } from './chartdata'

const dmarc = chartdata.map((d) => ({
  month: `${d.month}, ${d.year}`,
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

function YAxis({ labels, start, end, y }) {
  const style = {
    stroke: '#2e2e40',
    strokeWidth: '1px',
  }

  const textStyle = {
    fontSize: '0.8em',
    fill: '#2e2e40',
    textAnchor: 'end',
  }

  const ticks = range(0, end, end / labels.length)

  const lines = ticks.map((tick, index) => (
    <line
      key={`yaxis:tick:${index}`}
      style={style}
      y1={tick}
      x1={y}
      y2={tick}
      x2={y}
    />
  ))

  const columnLables = ticks.map((tick, index) => (
    <text
      key={`yaxis:label:${index}`}
      style={textStyle}
      y={tick}
      x={y}
      fontFamily="Verdana"
    >
      {labels[index]}
    </text>
  ))

  return (
    <g>
      <g className="y_labels" transform={`translate(${-5},${17})`}>
        <line x1={y} y1={start} y2={end} x2={y} style={style} />
      </g>
      <g className="y_labels" transform={`translate(${-5},${51})`}>
        {columnLables}
        {lines}
      </g>
    </g>
  )
}

YAxis.propTypes = {
  start: number,
  end: number,
  labels: arrayOf(number),
  y: number,
}

function XAxis({ start, end, labels, x }) {
  const style = {
    stroke: '#2e2e40',
    strokeWidth: '1px',
  }

  const step = (start + end) / labels.length
  console.log('step', step)

  const ticks = range(start, end, step)

  const lines = ticks.map((tick, index) => (
    <line
      key={`xaxis:tick:${index}`}
      style={style}
      x1={tick + 15}
      y1={x}
      x2={tick + 15}
      y2={x + 4}
    />
  ))

  const columnLables = ticks.map((tick, index) => (
    <text
      key={`xaxis:label:${index}`}
      style={{ fill: '#2e2e40' }}
      x={tick + 5}
      y={x + 20}
      fontFamily="Verdana"
      fontSize="10"
    >
      {labels[index]}
    </text>
  ))

  return (
    <g>
      <line x1={start} y1={x} x2={end} y2={x} style={style} />
      {columnLables}
      {lines}
    </g>
  )
}

XAxis.propTypes = {
  start: number,
  end: number,
  labels: arrayOf(string),
  x: number,
}

export function BarChart({ data = dmarc, width: w = 800, height: h = 500 }) {
  const margin = { top: 0, right: 20, bottom: 20, left: 70 }

  const width = w - margin.left - margin.right
  const height = h - margin.top - margin.bottom

  const series = stack().keys([
    'fullPass',
    'passDkimOnly',
    'passSpfOnly',
    'fail',
  ])(data)

  const y = scaleLinear()
    .domain([
      0,
      max(series, (d) => {
        return max(d, (d) => d[1])
      }),
    ])
    .range([margin.bottom, height])

  const months = data.map((d) => d.month)

  const x = scaleBand().domain(months).range([0, width]).padding(0.05)

  const color = scaleOrdinal()
    .domain(series.map((d) => d.key))
    .range(['#2E2E40', '#4F4F5E', '#70707C', '#92929B', '#B3B3B9'])
    .unknown('#ccc')

  return (
    <svg width={w} height={h}>
      <YAxis
        y={60}
        labels={y.ticks().reverse()}
        start={margin.bottom}
        end={height}
      />

      <g
        className="chart"
        transform={`translate(${margin.left},${margin.top})`}
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
        <XAxis x={height} labels={months} start={0} end={width} />
      </g>
    </svg>
  )
}

BarChart.propTypes = {
  height: number,
  width: number,
  data: arrayOf(object),
}
