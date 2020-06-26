import React from 'react'
import { Trans } from '@lingui/macro'
import { string } from 'prop-types'
import {
  Divider,
  Stack,
  Box,
  Link,
  Icon,
  Text,
  ListItem,
} from '@chakra-ui/core'
import { sanitizeUrl } from './sanitizeUrl'

export function Domain({ url, lastRan, ...rest }) {
  return (
    <ListItem {...rest}>
      <Stack spacing={4} padding={[1, 2, 3]}>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Domain:</Trans>
          </Text>
          <Link
            // TODO: have the API enforce a scheme
            // so we don't need to guess badly here.
            href={`http://${sanitizeUrl(url)}`}
            isExternal
            target="_blank"
            rel="noopener noreferrer"
          >
            {url}
            <Icon name="external-link" mx="2px" />
          </Link>
        </Stack>
        {lastRan && (
          <Stack isInline>
            <Text fontWeight="bold">
              <Trans>Last scanned:</Trans>
            </Text>
            <Text>{lastRan}</Text>
          </Stack>
        )}
        {!lastRan && (
          <Box>
            <Text fontWeight="bold">
              <Trans>Not scanned yet.</Trans>
            </Text>
          </Box>
        )}
      </Stack>
      <Divider borderColor="gray.900" />
    </ListItem>
  )
}
Domain.propTypes = { url: string, lastRan: string }
