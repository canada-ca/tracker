import React from 'react'
import { arrayOf, func, number, object, string } from 'prop-types'
import { Box, Image, Stack, Text } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'

import { useArcs } from '../utilities/useArcs'
import trackerLogo from '../images/tracker_v-03.png'

export const Doughnut = ({
  data,
  height,
  width,
  title,
  valueAccessor = (d) => d,
  innerRadius = Math.ceil(width / 2.8),
  outerRadius = Math.ceil(width / 2.2),
  padAngle = 0.025,
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
  const { i18n } = useLingui()

  const domainContext = title.includes('DMARC') ? (
    <Trans>Total</Trans>
  ) : (
    <Trans>Web-hosting</Trans>
  )

  const centerMessage = (
    <>
      <text
        display={i18n.locale === 'en' ? 'none' : 'inline'}
        x={0}
        y={15}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={
          i18n.locale === 'en' ? `${width / 256}rem` : `${width / 300}rem`
        }
        transform={`translate(${width / 2}, ${height / 2})`}
      >
        <Trans>Domains</Trans>
      </text>
      <text
        x={0}
        y={i18n.locale === 'en' ? 20 : 30}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={
          i18n.locale === 'en' ? `${width / 256}rem` : `${width / 300}rem`
        }
        transform={`translate(${width / 2}, ${height / 2})`}
      >
        {domainContext}
      </text>
      <text
        display={i18n.locale === 'en' ? 'inline' : 'none'}
        x={0}
        y={40}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={
          i18n.locale === 'en' ? `${width / 256}rem` : `${width / 512}rem`
        }
        transform={`translate(${width / 2}, ${height / 2})`}
      >
        <Trans>Domains</Trans>
      </text>
    </>
  )

  let chartContent
  if (data[0].total) {
    chartContent = (
      <svg height={height} width={width}>
        <title>{title}</title>
        <text
          x={0}
          y={-15}
          width={Math.ceil(width / 2.8)}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={`${width / 128}rem`}
          transform={`translate(${width / 2}, ${height / 2})`}
        >
          {data[0].total}
        </text>
        {centerMessage}
        <g transform={`translate(${width / 2},${height / 2})`}>
          {arcs.map((arc, index) => {
            return children({ d: arc.d, fill: data[index].color }, index)
          })}
        </g>
      </svg>
    )
  } else {
    chartContent = (
      <Box>
        <Image src={trackerLogo} alt={'Tracker Logo'} />
        <Text fontSize="l" textAlign="center" color="black">
          <Trans>No scan data for this organization.</Trans>
        </Text>
      </Box>
    )
  }

  return (
    <div {...rest}>
      <Box my="4">{chartContent}</Box>
      {arcs.map(({ title, count, percentage }, index) => {
        if (percentage % 1 >= 0.5) {
          percentage = Math.ceil(percentage)
        } else {
          percentage = Math.floor(percentage)
        }
        return (
          <Stack
            isInline
            borderTop={index === 0 && '1px'}
            textAlign="left"
            align="center"
            key={`legend:${index}`}
            px="4"
            py={arcs.length > 2 ? '2' : '5'}
            overflow="hidden"
          >
            <svg
              height={30}
              width={30}
              style={{ display: 'inline', marginRight: '1em' }}
              aria-hidden="true"
            >
              <g>
                <rect
                  stroke="#fff"
                  strokeWidth="2"
                  width="30"
                  height="30"
                  fill={data[index].color}
                />
              </g>
            </svg>
            <p
              style={{
                color: 'black',
                fontWeight: 'bold',
                display: 'inline',
              }}
            >
              {`${title}: ${count} - ${percentage}% `}
            </p>
          </Stack>
        )
      })}
    </div>
  )
}

Doughnut.propTypes = {
  id: string,
  data: arrayOf(object),
  title: string,
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
