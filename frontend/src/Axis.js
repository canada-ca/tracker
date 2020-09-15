import React from 'react'
import { arrayOf, number, func } from 'prop-types'

export function Axis({ ticks, label, border, children, ...rest }) {
  return (
    <g {...rest}>
      {label()}
      {border()}
      {ticks.map((tick, index) => {
        return children(tick, index)
      })}
    </g>
  )
}

Axis.propTypes = {
  children: func,
  border: func,
  label: func,
  ticks: arrayOf(number),
}
