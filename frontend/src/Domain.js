import React from 'react'
import { Trans, t } from '@lingui/macro'
import { string } from 'prop-types'
import { Stack, Link, Icon, Text } from '@chakra-ui/core'
import { useLingui } from '@lingui/react'

export function Domain({ url, lastRan, ...rest }) {
  const { i18n } = useLingui()

  return (
    // <ListItem {...rest}>
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
      {lastRan ? (
        <Text>
          <Trans>Last scanned:{lastRan}</Trans>
        </Text>
      ) : (
        <Text>
          <Trans>Not scanned yet.</Trans>
        </Text>
      )}
    </Stack>
    // </ListItem>
  )
}
Domain.propTypes = { url: string, lastRan: string }
