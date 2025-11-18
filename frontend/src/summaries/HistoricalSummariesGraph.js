import React, { useCallback } from 'react'
import { Box, Flex, Select, Text } from '@chakra-ui/react'
import { array, bool, number, string } from 'prop-types'
import { extent, bisector } from 'd3-array'
import theme from '../theme/canada'

import { AxisLeft, AxisBottom } from '@visx/axis'
import { LinearGradient } from '@visx/gradient'
import { GridRows, GridColumns } from '@visx/grid'
import { Group } from '@visx/group'
import { localPoint } from '@visx/event'
import { scaleLinear } from '@visx/scale'
import { Line, LinePath } from '@visx/shape'
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip'
import { timeFormat } from '@visx/vendor/d3-time-format'
import { GlyphCircle } from '@visx/glyph'
import { Trans, t } from '@lingui/macro'
import { func } from 'prop-types'
import useSearchParam from '../utilities/useSearchParam'
import { useLocation } from 'react-router-dom'
import { ABTestVariant, ABTestWrapper } from '../app/ABTestWrapper'

const getDate = ({ date }) => new Date(date)

const getSummaries = (data, scanTypes, scoreType) => {
  let summaries = []
  data?.forEach((summary) => {
    for (const scanType of scanTypes) {
      const { date, [scanType]: scanTypeData } = summary
      let score = 0
      if (scanType === 'negativeFindings') {
        score = scanTypeData?.guidanceTags?.map(({ count }) => count)?.reduce((a, b) => a + b)
      } else {
        score = scanTypeData.categories[0][scoreType]?.toFixed(0)
      }
      if (typeof score === 'undefined') continue
      summaries.push({ date, type: scanType, score })
    }
  })
  return summaries
}

const getSeries = (summaries, scanTypes) => {
  let series = []
  for (const scanType of scanTypes) {
    const scanTypeSeries = summaries.filter(({ type }) => {
      return type === scanType
    })
    series.push(scanTypeSeries)
  }
  return series
}

const tieredSummaries = {
  one: ['https', 'dmarc'],
  two: ['webConnections', 'ssl', 'spf', 'dkim', 'dmarcPhase'],
  three: ['web', 'mail'],
  four: ['negativeFindings'],
}

export function HistoricalSummariesGraph({
  data,
  setRange,
  selectedRange = 'last30days',
  width = 1200,
  height = 500,
  userHasPermission,
}) {
  const { colors } = theme
  const location = useLocation()

  const { searchValue: scoreTypeParam, setSearchParams: setScoreTypeParam } = useSearchParam({
    name: 'score-type',
    validOptions: ['percentage', 'count'],
    defaultValue: 'percentage',
  })
  const { searchValue: summaryTierParam, setSearchParams: setSummaryTierParam } = useSearchParam({
    name: 'summary-tier',
    validOptions: Object.keys(tieredSummaries),
    defaultValue: 'one',
  })
  const { searchValue: domainTypeParam, setSearchParams: setDomainTypeParam } = useSearchParam({
    name: 'domain-type',
    validOptions: ['local', 'global'],
    defaultValue: 'global',
  })

  const summaries = getSummaries(data, tieredSummaries[summaryTierParam], scoreTypeParam)
  summaries.sort((a, b) => getDate(a) - getDate(b))

  const summaryNames = {
    https: `HTTPS`,
    dmarc: `DMARC`,
    webConnections: t`Web Connections`,
    ssl: `SSL`,
    spf: `SPF`,
    dkim: `DKIM`,
    dmarcPhase: `DMARC`,
    web: t`Web`,
    mail: t`Mail`,
    negativeFindings: t`Negative Findings`,
  }

  // tooltip parameters
  const { tooltipData, tooltipLeft = 0, tooltipTop = 0, showTooltip, hideTooltip } = useTooltip()

  // define margins from where to start drawing the chart
  const margin = { top: 40, right: 40, bottom: 40, left: 40 }

  // defining inner measurements
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const series = getSeries(summaries, tieredSummaries[summaryTierParam])

  // colors for lines
  const graphColours = [
    colors.tracker.warm.medium,
    colors.tracker.cool.medium,
    colors.tracker.warm.light,
    colors.tracker.cool.light,
    colors.tracker.logo.orange,
  ]

  // Defining selector functions
  const getRD = ({ score }) => score
  const bisectDate = bisector(({ date }) => new Date(date)).left

  // get data from a date
  const getD = (date) => {
    const output = summaries.filter((sum) => {
      return sum.date === date
    })
    return output
  }

  // to remove comma from date
  const formatDate = timeFormat('%y-%m-%d')

  // horizontal, x scale
  const timeScale = scaleLinear({
    range: [0, innerWidth],
    domain: extent(summaries, getDate),
    nice: true,
  })

  const getDomain = () => {
    const scores = summaries.map(getRD)
    const minScore = Math.min(...scores)
    const maxScore = Math.max(...scores)
    if (domainTypeParam === 'local') {
      const localMin = Math.round(minScore * 0.9)
      let localMax = maxScore * 1.1
      if (scoreTypeParam === 'percentage') {
        localMax = localMax >= 100 ? 100 : localMax
      }
      return [localMin, localMax]
    }
    return [0, scoreTypeParam === 'percentage' ? 100 : maxScore]
  }

  // vertical, y scale
  const rdScale = scaleLinear({
    range: [innerHeight, 0],
    domain: getDomain(),
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
    <Box className="progress-graph">
      <Flex align="center" my="2">
        <Text fontSize="lg" fontWeight="bold" textAlign="center">
          <Trans>Range:</Trans>
        </Text>
        <Select mx="2" maxW="20%" borderColor="black" value={selectedRange} onChange={(e) => setRange(e.target.value)}>
          <option value="last30days">
            <Trans>Last 30 Days</Trans>
          </option>
          <option value="lastyear">
            <Trans>Last 365 Days</Trans>
          </option>
          <option value="ytd">
            <Trans>Year to Date</Trans>
          </option>
          <ABTestWrapper>
            <ABTestVariant name="B">
              <option value="all">
                <Trans>All Time</Trans>
              </option>
            </ABTestVariant>
          </ABTestWrapper>
        </Select>
        <Text ml="2" fontSize="lg" fontWeight="bold" textAlign="center">
          <Trans>Scope:</Trans>
        </Text>
        <Select
          mx="2"
          maxW="20%"
          borderColor="black"
          value={domainTypeParam}
          onChange={(e) => setDomainTypeParam(e.target.value)}
        >
          <option value="local">
            <Trans>Local</Trans>
          </option>
          <option value="global">
            <Trans>Global</Trans>
          </option>
        </Select>
        <Text fontSize="lg" fontWeight="bold" textAlign="center">
          <Trans>Data:</Trans>
        </Text>
        <Select
          mx="2"
          maxW="20%"
          borderColor="black"
          value={scoreTypeParam}
          onChange={(e) => setScoreTypeParam(e.target.value)}
          isDisabled={summaryTierParam === 'four'}
        >
          <option value="percentage">
            <Trans>Percentage</Trans>
          </option>
          <option value="count">
            <Trans>Domain count</Trans>
          </option>
        </Select>
        <Text ml="2" fontSize="lg" fontWeight="bold" textAlign="center">
          <Trans>Summary Tier:</Trans>
        </Text>
        <Select
          mx="2"
          maxW="20%"
          borderColor="black"
          value={summaryTierParam}
          onChange={(e) => setSummaryTierParam(e.target.value)}
        >
          <option value="one">
            <Trans>Tier 1: Minimum Requirements</Trans>
          </option>
          <option value="two">
            <Trans>Tier 2: Improved Posture</Trans>
          </option>
          <option value="three">
            <Trans>Tier 3: Compliance</Trans>
          </option>
          {location.pathname.includes('/organizations/') && userHasPermission && (
            <option value="four">
              <Trans>Total Negative Findings</Trans>
            </option>
          )}
        </Select>
      </Flex>
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
            <GridColumns
              scale={timeScale}
              width={innerWidth}
              height={innerHeight}
              stroke="#EDF2F7"
              strokeOpacity={0.2}
            />
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
                stroke={graphColours[i]}
                strokeWidth={3}
                data={sData}
                x={(d) => timeScale(getDate(d)) ?? 0}
                y={(d) => rdScale(getRD(d)) ?? 0}
              />
            ))}
            {tooltipData &&
              tooltipData.map((d, i) => (
                <g key={i}>
                  <GlyphCircle
                    left={tooltipLeft - margin.left}
                    top={rdScale(d.score) + 2}
                    size={110}
                    fill={graphColours[i]}
                    stroke={'white'}
                    strokeWidth={2}
                  />
                </g>
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
            <Text fontWeight="bold" color="white">{`${formatDate(getDate(tooltipData[0]))}`}</Text>
            {tooltipData.map((d, i) => (
              <Text fontWeight="bold" key={i} color={graphColours[i]}>{`${summaryNames[d.type]}: ${getRD(
                tooltipData[i],
              )}${scoreTypeParam === 'percentage' && summaryTierParam !== 'four' ? '%' : ''}`}</Text>
            ))}
          </TooltipWithBounds>
        )}
      </Box>
    </Box>
  )
}

HistoricalSummariesGraph.propTypes = {
  data: array.isRequired,
  setRange: func.isRequired,
  selectedRange: string,
  width: number,
  height: number,
  userHasPermission: bool,
}
