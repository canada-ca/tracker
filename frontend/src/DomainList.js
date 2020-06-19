import React from 'react'
import { Trans } from '@lingui/macro'
import { List, ListItem } from '@chakra-ui/core'
import { string, arrayOf, func, shape, object } from 'prop-types'

export function DomainList({ domains = [], ...props }) {
  const elements = []
  if (!domains || (domains && domains.length === 0)) {
    return (
      <List {...props}>
        <ListItem key={'no-domains-scanned'}>
          <Trans>No domains scanned yet.</Trans>
        </ListItem>
      </List>
    )
  } else {
    for (const domain of domains) {
      elements.push(props.children(domain))
    }
    return <List {...props}>{elements}</List>
  }
}

DomainList.propTypes = {
  children: func,
  domains: arrayOf(
    shape({
      node: shape({ organization: object, url: string, lastRan: string }),
    }),
  ),
}
