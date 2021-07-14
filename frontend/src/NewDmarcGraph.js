import React from 'react'
import { BarStack, BarStackHorizontal } from '@visx/shape'
import { Group } from '@visx/group'
import { Grid } from '@visx/grid'
import { AxisBottom, AxisLeft } from '@visx/axis'
import cityTemperature from '@visx/mock-data/lib/mocks/cityTemperature'
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale'
import { timeParse, timeFormat } from 'd3-time-format'
import {
  // Tooltip,
  useTooltip,
  useTooltipInPortal,
  defaultStyles,
} from '@visx/tooltip'
import { LegendOrdinal } from '@visx/legend'
import theme from './theme/canada'

const { strong, moderate, moderateAlt, weak, gray } = theme.colors
const textColour = gray['900']
const background = gray['50']
const defaultVerticalMargin = { top: 40, right: 0, bottom: 0, left: 0 }
const defaultHorizontalMargin = { top: 40, left: 50, right: 40, bottom: 100 }
const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: 'rgba(0,0,0,0.9)',
  color: 'white',
}

const data = cityTemperature.slice(0, 13)
const keys = Object.keys(data[0]).filter((d) => d !== 'date')

const temperatureTotals = data.reduce((allTotals, currentDate) => {
  const totalTemperature = keys.reduce((dailyTotal, k) => {
    dailyTotal += Number(currentDate[k])
    return dailyTotal
  }, 0)
  if (Array.isArray(allTotals)) {
    allTotals.push(totalTemperature)
    return allTotals
  }
  return []
})

const parseDate = timeParse('%Y-%m-%d')
const format = timeFormat('%b %d')
const formatDate = (date) => format(parseDate(date))

const getDate = (d) => d.date

const dateScale = scaleBand({
  domain: data.map(getDate),
  padding: 0.2,
})
const temperatureScale = scaleLinear({
  domain: [0, Math.max(...temperatureTotals)],
  nice: true,
})
const colorScale = scaleOrdinal({
  domain: keys,
  range: [strong, moderate, weak],
})

let tooltipTimeout

function VerticalGraph({
  width = 1200,
  height = 600,
  events = false,
  margin = defaultVerticalMargin,
}) {
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip()

  const { containerRef, TooltipInPortal } = useTooltipInPortal()

  if (width < 10) return null
  const xMax = width
  const yMax = height - margin.top - 100

  dateScale.rangeRound([0, xMax])
  temperatureScale.range([yMax, 0])

  return width < 10 ? null : (
    <div style={{ position: 'relative' }}>
      <svg ref={containerRef} width={width} height={height}>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={background}
          rx={14}
        />
        <Grid
          top={margin.top}
          left={margin.left}
          xScale={dateScale}
          yScale={temperatureScale}
          width={xMax}
          height={yMax}
          stroke="black"
          strokeOpacity={0.1}
          xOffset={dateScale.bandwidth() / 2}
        />
        <Group top={margin.top}>
          <BarStack
            data={data}
            keys={keys}
            x={getDate}
            xScale={dateScale}
            yScale={temperatureScale}
            color={colorScale}
          >
            {(barStacks) =>
              barStacks.map((barStack) =>
                barStack.bars.map((bar) => (
                  <rect
                    key={`bar-stack-${barStack.index}-${bar.index}`}
                    x={bar.x}
                    y={bar.y}
                    height={bar.height}
                    width={bar.width}
                    fill={bar.color}
                    onClick={() => {
                      if (events)
                        window.alert(`clicked: ${JSON.stringify(bar)}`)
                    }}
                    onMouseLeave={() => {
                      tooltipTimeout = window.setTimeout(() => {
                        hideTooltip()
                      }, 300)
                    }}
                    onMouseMove={(event) => {
                      if (tooltipTimeout) clearTimeout(tooltipTimeout)
                      const top = event.clientY - margin.top - bar.height
                      const left = bar.x + bar.width / 2
                      showTooltip({
                        tooltipData: bar,
                        tooltipTop: top,
                        tooltipLeft: left,
                      })
                    }}
                  />
                )),
              )
            }
          </BarStack>
        </Group>
        <AxisBottom
          top={yMax + margin.top}
          scale={dateScale}
          tickFormat={formatDate}
          stroke={textColour}
          tickStroke={textColour}
          tickLabelProps={() => ({
            fill: textColour,
            fontSize: 11,
            textAnchor: 'middle',
          })}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: margin.top / 2 - 10,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          fontSize: '14px',
        }}
      >
        <LegendOrdinal
          scale={colorScale}
          direction="row"
          labelMargin="0 15px 0 0"
        />
      </div>

      {tooltipOpen && tooltipData && (
        <TooltipInPortal
          key={Math.random()} // update tooltip bounds each render
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div style={{ color: colorScale(tooltipData.key) }}>
            <strong>{tooltipData.key}</strong>
          </div>
          <div>{tooltipData.bar.data[tooltipData.key]}℉</div>
          <div>
            <small>{formatDate(getDate(tooltipData.bar.data))}</small>
          </div>
        </TooltipInPortal>
      )}
    </div>
  )
}

function HorizontalGraph({
  width = 1200,
  height = 600,
  events = false,
  margin = defaultHorizontalMargin,
}) {
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip()
  const xMax = width - margin.left - margin.right
  const yMax = height - margin.top - margin.bottom

  const { containerRef, TooltipInPortal } = useTooltipInPortal()

  temperatureScale.rangeRound([0, xMax])
  dateScale.rangeRound([yMax, 0])

  return width < 10 ? null : (
    <div>
      <div
        style={{
          position: 'absolute',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignContent: 'center',
          fontSize: '14px',
        }}
      >
        <LegendOrdinal
          scale={colorScale}
          direction="row"
          labelMargin="0 15px 0 0"
        />
      </div>
      <svg ref={containerRef} width={width} height={height}>
        <LegendOrdinal
          scale={colorScale}
          direction="row"
          labelMargin="0 15px 0 0"
        />
        <rect width={width} height={height} fill={background} rx={14} />
        <Group top={margin.top} left={margin.left}>
          <BarStackHorizontal
            data={data}
            keys={keys}
            height={yMax}
            y={getDate}
            xScale={temperatureScale}
            yScale={dateScale}
            color={colorScale}
          >
            {(barStacks) =>
              barStacks.map((barStack) =>
                barStack.bars.map((bar) => (
                  <rect
                    key={`barstack-horizontal-${barStack.index}-${bar.index}`}
                    x={bar.x}
                    y={bar.y}
                    width={bar.width}
                    height={bar.height}
                    fill={bar.color}
                    onClick={() => {
                      if (events)
                        window.alert(`clicked: ${JSON.stringify(bar)}`)
                    }}
                    onMouseLeave={() => {
                      tooltipTimeout = window.setTimeout(() => {
                        hideTooltip()
                      }, 300)
                    }}
                    onMouseMove={() => {
                      if (tooltipTimeout) clearTimeout(tooltipTimeout)
                      const top = bar.y + margin.top
                      const left = bar.x + bar.width + margin.left
                      showTooltip({
                        tooltipData: bar,
                        tooltipTop: top,
                        tooltipLeft: left,
                      })
                    }}
                  />
                )),
              )
            }
          </BarStackHorizontal>
          <AxisLeft
            hideAxisLine
            hideTicks
            scale={dateScale}
            tickFormat={formatDate}
            stroke={textColour}
            tickStroke={textColour}
            tickLabelProps={() => ({
              fill: textColour,
              fontSize: 11,
              textAnchor: 'end',
              dy: '0.33em',
            })}
          />
          <AxisBottom
            top={yMax}
            scale={temperatureScale}
            stroke={textColour}
            tickStroke={textColour}
            tickLabelProps={() => ({
              fill: textColour,
              fontSize: 11,
              textAnchor: 'middle',
            })}
          />
        </Group>
      </svg>
      {/* <div
        style={{
          position: 'absolute',
          top: margin.top / 2 - 10,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          fontSize: '14px',
        }}
      >
        <LegendOrdinal
          scale={colorScale}
          direction="row"
          labelMargin="0 15px 0 0"
        />
      </div> */}
      {/* {tooltipOpen && tooltipData && (
        <Tooltip top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
          <div style={{ color: colorScale(tooltipData.key) }}>
            <strong>{tooltipData.key}</strong>
          </div>
          <div>{tooltipData.bar.data[tooltipData.key]}℉</div>
          <div>
            <small>{formatDate(getDate(tooltipData.bar.data))}</small>
          </div>
        </Tooltip>
      )} */}
      {tooltipOpen && tooltipData && (
        <TooltipInPortal
          key={Math.random()} // update tooltip bounds each render
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div style={{ color: colorScale(tooltipData.key) }}>
            <strong>{tooltipData.key}</strong>
          </div>
          <div>{tooltipData.bar.data[tooltipData.key]}℉</div>
          <div>
            <small>{formatDate(getDate(tooltipData.bar.data))}</small>
          </div>
        </TooltipInPortal>
      )}
    </div>
  )
}

export function NewDmarcGraph({ orientation }) {
  if (orientation) return <VerticalGraph />
  else return <HorizontalGraph />
}
