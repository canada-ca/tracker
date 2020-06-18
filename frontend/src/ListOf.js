import React from 'react'
import { List, ListItem } from '@chakra-ui/core'
import { array, func } from 'prop-types'

export function ListOf({ elements = [], ifEmpty, ...props }) {
  const elmnts = []
  if (!elements || (elements && elements.length === 0)) {
    return (
      <List {...props}>
        <ListItem key={'no-elements'}>{ifEmpty()}</ListItem>
      </List>
    )
  } else {
    for (const [index, value] of elements.entries()) {
      elmnts.push(props.children(value, index))
    }
    return <List {...props}>{elmnts}</List>
  }
}

ListOf.propTypes = {
  children: func,
  ifEmpty: func,
  elements: array,
}
