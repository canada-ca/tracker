import React from 'react'
import { Trans } from '@lingui/macro'
import { string } from 'prop-types'
import { Stack, Link, Icon, Text, ListItem } from '@chakra-ui/core'

export function Domain({ url, lastRan, ...rest }) {
  return (
    <ListItem {...rest}>
      <Stack spacing={4} padding={[1, 2, 3]} direction="row" flexWrap="wrap">
        <Link
          href={`http://${encodeURIComponent(url)}`}
          isExternal
          target="_blank"
          rel="noopener noreferrer"
        >
          {url}
          <Icon name="external-link" mx="2px" />
        </Link>
        {lastRan && (
          <Text>
            <Trans>Last scanned:{lastRan}</Trans>
          </Text>
        )}
        {!lastRan && (
          <Text>
            <Trans>Not scanned yet.</Trans>
          </Text>
        )}
      </Stack>
    </ListItem>
  )
}
Domain.propTypes = { url: string, lastRan: string }
