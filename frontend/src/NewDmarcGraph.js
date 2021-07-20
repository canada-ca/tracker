import React, { useState } from 'react'
import { BarStack, BarStackHorizontal } from '@visx/shape'
import { Group } from '@visx/group'
import { Grid } from '@visx/grid'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale'
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip'
import { LegendOrdinal } from '@visx/legend'
import { withScreenSize } from '@visx/responsive'
import theme from './theme/canada'
import { TrackerButton } from './TrackerButton'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Box, Stack, Text } from '@chakra-ui/core'

const { strong, moderate, moderateAlt, weak, gray } = theme.colors
const textColour = gray['900']
const background = gray['50']
const defaultVerticalMargin = { top: 40, right: 0, bottom: 0, left: 0 }
const defaultHorizontalMargin = { top: 40, left: 50, right: 40, bottom: 100 }
const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: 'white',
  color: 'black',
  borderColor: 'black',
  borderWidth: '1px',
}

const totalKeys = ['fullPass', 'passSpfOnly', 'passDkimOnly', 'fail']
const percentageKeys = [
  'fullPassPercentage',
  'passSpfOnlyPercentage',
  'passDkimOnlyPercentage',
  'failPercentage',
]
const getDate = (d) => d.date
let tooltipTimeout

const ordinalColorScale = scaleOrdinal({
  domain: ['Pass', 'Fail DKIM', 'Fail SPF', 'Fail'],
  range: [strong, moderate, moderateAlt, weak],
})

function formatLargeInt(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function NewDmarcGraph({ ...props }) {
  const { i18n } = useLingui()
  const { data } = props
  const [isHorizontal, setIsHorizontal] = useState(false)
  const [isNormalised, setIsNormailsed] = useState(false)

  let keys = totalKeys

  data.periods.sort((a, b) => {
    if (a.month === 'LAST30DAYS') return 1
    if (b.month === 'LAST30DAYS') return -1
    const aDate = new Date(`${a.month} 1, ${a.year}`)
    const bDate = new Date(`${b.month} 1, ${b.year}`)
    return aDate - bDate
  })

  // Format dates
  data.periods.forEach((period) => {
    let date
    period.month === 'LAST30DAYS'
      ? (date = t`L-30-D`)
      : (date = new Date(`${period.month} 1, ${period.year}`)
          .toLocaleDateString(i18n.locale, { month: 'short', year: '2-digit' })
          .replace(/ /, '-'))
    period.date = date
  })

  if (isNormalised) {
    keys = percentageKeys
  } else {
    keys = totalKeys
  }

  const ResponsiveHorizontalGraph = withScreenSize(HorizontalGraph)
  const ResponsiveVerticalGraph = withScreenSize(VerticalGraph)

  return (
    <Stack w="100%" align={['center', 'flex-start']}>
      <Stack isInline align="center" spacing="4">
        <TrackerButton
          variant="primary"
          onClick={() => setIsHorizontal(!isHorizontal)}
          mb="4"
        >
          {isHorizontal ? (
            <Trans>Vertical View</Trans>
          ) : (
            <Trans>Horizontal View</Trans>
          )}
        </TrackerButton>
        <TrackerButton
          variant="primary"
          onClick={() => setIsNormailsed(!isNormalised)}
          mb="4"
        >
          {isNormalised ? (
            <Trans>Total Messages</Trans>
          ) : (
            <Trans>Percentages</Trans>
          )}
        </TrackerButton>
      </Stack>
      {isHorizontal ? (
        <ResponsiveHorizontalGraph data={data} keys={keys} />
      ) : (
        <ResponsiveVerticalGraph data={data} keys={keys} />
      )}
    </Stack>
  )
}

function VerticalGraph({
  width = 1200,
  height = 500,
  events = false,
  margin = defaultVerticalMargin,
  ...props
}) {
  const { data, keys, screenWidth } = props

  const { periods, strengths } = data
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip()

  if (screenWidth < 1200) {
    width = screenWidth
  }

  const monthlyTotals = []
  periods.forEach((period) => {
    let total = 0
    keys.forEach((key) => {
      total += Number(period[key])
    })
    monthlyTotals.push(total)
  })

  const dateScale = scaleBand({
    domain: periods.map(getDate),
    padding: 0.2,
  })
  const messageScale = scaleLinear({
    domain: [0, Math.max(...monthlyTotals)],
    nice: true,
  })

  const colorScale = scaleOrdinal({
    domain: keys,
    range: [strong, moderate, moderateAlt, weak],
  })

  const { containerRef, TooltipInPortal } = useTooltipInPortal()

  if (width < 10) return null
  const xMax = width
  const yMax = height - margin.top - 100

  dateScale.rangeRound([0, xMax])
  messageScale.range([yMax, 0])

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
          yScale={messageScale}
          width={xMax}
          height={yMax}
          stroke="black"
          strokeOpacity={0.1}
          xOffset={dateScale.bandwidth() / 2}
        />
        <Group top={margin.top}>
          <BarStack
            data={periods}
            keys={keys}
            x={getDate}
            xScale={dateScale}
            yScale={messageScale}
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
          <AxisLeft
            scale={messageScale}
            stroke={textColour}
            tickStroke={textColour}
            tickLabelProps={() => ({
              fill: textColour,
              fontSize: 11,
              textAnchor: 'end',
            })}
          />
        </Group>
        <AxisBottom
          top={yMax + margin.top}
          scale={dateScale}
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
          scale={ordinalColorScale}
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
          <Box mb="1">
            <Text fontWeight="bold">{getDate(tooltipData.bar.data)}</Text>
          </Box>
          {keys.map((label, idx) => {
            return (
              <Stack
                mb="1"
                key={idx}
                isInline
                align="center"
                justifyContent="space-between"
              >
                <Box color={colorScale(label)}>
                  <Text fontWeight="bold">{strengths[label]}:</Text>
                </Box>
                <Box>
                  <Text>
                    {formatLargeInt(tooltipData.bar.data[label])}
                    {keys[0] === percentageKeys[0] && <>%</>}
                  </Text>
                </Box>
              </Stack>
            )
          })}
        </TooltipInPortal>
      )}
    </div>
  )
}

function HorizontalGraph({
  width = 1200,
  height = 500,
  events = false,
  margin = defaultHorizontalMargin,
  ...props
}) {
  const { data, keys, screenWidth } = props
  const { periods, strengths } = data
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip()

  if (screenWidth < 1200) {
    width = screenWidth
  }

  const xMax = width - margin.left - margin.right
  const yMax = height - margin.top - margin.bottom

  const { containerRef, TooltipInPortal } = useTooltipInPortal()

  const monthlyTotals = []
  periods.forEach((period) => {
    let total = 0
    keys.forEach((key) => {
      total += Number(period[key])
    })
    monthlyTotals.push(total)
  })

  const dateScale = scaleBand({
    domain: periods.map(getDate),
    padding: 0.2,
  })
  const messageScale = scaleLinear({
    domain: [0, Math.max(...monthlyTotals)],
    nice: true,
  })

  const colorScale = scaleOrdinal({
    domain: keys,
    range: [strong, moderate, moderateAlt, weak],
  })

  messageScale.rangeRound([0, xMax])
  dateScale.rangeRound([yMax, 0])

  return width < 10 ? null : (
    <div>
      <div
        style={{
          position: 'absolute',
          // bottom: margin.bottom / 2 + 51,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          left: margin.left / 2 - 17,
          fontSize: '14px',
        }}
      >
        <LegendOrdinal
          scale={ordinalColorScale}
          direction="row"
          labelMargin="0 15px 0 0"
        />
      </div>
      <svg ref={containerRef} width={width} height={height}>
        <rect width={width} height={height} fill={background} rx={14} />
        <Grid
          top={margin.top}
          left={margin.left}
          yScale={dateScale}
          xScale={messageScale}
          width={xMax}
          height={yMax}
          stroke="black"
          strokeOpacity={0.1}
          yOffset={dateScale.bandwidth() / 2}
        />
        <Group top={margin.top} left={margin.left}>
          <BarStackHorizontal
            data={periods}
            keys={keys}
            height={yMax}
            y={getDate}
            xScale={messageScale}
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
            scale={messageScale}
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

      {tooltipOpen && tooltipData && (
        <TooltipInPortal
          key={Math.random()} // update tooltip bounds each render
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <Box mb="1">
            <Text fontWeight="bold">{getDate(tooltipData.bar.data)}</Text>
          </Box>
          {keys.map((label, idx) => {
            return (
              <Stack
                mb="1"
                key={idx}
                isInline
                align="center"
                justifyContent="space-between"
              >
                <Box color={colorScale(label)}>
                  <Text fontWeight="bold">{strengths[label]}:</Text>
                </Box>
                <Box>
                  <Text>
                    {formatLargeInt(tooltipData.bar.data[label])}
                    {keys[0] === percentageKeys[0] && <>%</>}
                  </Text>
                </Box>
              </Stack>
            )
          })}
        </TooltipInPortal>
      )}
    </div>
  )
}
