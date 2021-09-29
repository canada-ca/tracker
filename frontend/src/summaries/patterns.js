import React from 'react'
import { number, string } from 'prop-types'

export function CrossHatch({
  id = 'crosshatch',
  background = '#000',
  color = '#fff',
  width = '0.5',
  angle = 0,
  ...rest
}) {
  return (
    <pattern
      id={id}
      patternUnits="userSpaceOnUse"
      width="10"
      height="10"
      patternTransform={`rotate(${angle})`}
      {...rest}
    >
      <rect width="10" height="10" fill={background} />
      <path
        fill="none"
        d="M0 0h10v10h-10z"
        strokeWidth={width}
        stroke={color}
      />
    </pattern>
  )
}

CrossHatch.propTypes = {
  id: string,
  background: string,
  color: string,
  width: number,
  angle: number,
}

export function ZigZag({
  id = 'zigzag',
  background = '#000',
  color = '#fff',
  width = '0.5',
  angle = 0,
  ...rest
}) {
  return (
    <pattern
      id={id}
      patternUnits="userSpaceOnUse"
      width="10"
      height="10"
      patternTransform={`rotate(${angle})`}
      {...rest}
    >
      <rect width="10" height="10" fill={background} />
      <path
        d="M 0 0 L 5 10 L 10 0"
        stroke={color}
        fill="none"
        strokeWidth={width}
      ></path>
    </pattern>
  )
}

ZigZag.propTypes = {
  id: string,
  background: string,
  color: string,
  width: number,
  angle: number,
}

export function Dots({
  id = 'dots',
  size = '1',
  background = '#000',
  color = '#fff',
  ...rest
}) {
  return (
    <pattern
      id={id}
      patternUnits="userSpaceOnUse"
      width="10"
      height="10"
      {...rest}
    >
      <rect width="10" height="10" fill={background} />
      <circle cx="1" cy="1" r={size} fill={color} />
    </pattern>
  )
}

Dots.propTypes = {
  id: string,
  size: number,
  background: string,
  color: string,
  width: number,
  angle: string,
}

export function Stripes({
  id = 'stripes',
  angle = 45,
  background = '#fff',
  color = '#000',
  width = '2',
  ...rest
}) {
  return (
    <pattern
      id={id}
      patternUnits="userSpaceOnUse"
      width="10"
      height="10"
      patternTransform={`rotate(${angle})`}
      {...rest}
    >
      <rect width="10" height="10" fill={background} />
      <path
        d="M 0 10 L 10 0 M -1 1 L 1 -1 M 9 11 L 11 9"
        stroke={color}
        strokeWidth={width}
      />
    </pattern>
  )
}

Stripes.propTypes = {
  id: string,
  background: string,
  color: string,
  width: number,
  angle: number,
}
