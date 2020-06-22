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

export function Domain({ url, lastRan, ...rest }) {
  return (
    <ListItem {...rest}>
      <Stack spacing={4} padding={[1, 2, 3]}>
        <Box>
          <Text py={2} fontWeight="bold">
            <Trans>Domain:</Trans>
          </Text>
          <Link
            href={`http://${encodeURIComponent(url)}`}
            isExternal
            target="_blank"
            rel="noopener noreferrer"
          >
            {url}
            <Icon name="external-link" mx="2px" />
          </Link>
        </Box>
        {lastRan && (
          <Box>
            <Text py={2} fontWeight="bold">
              <Trans>Last scanned:</Trans>
            </Text>
            <Text>{lastRan}</Text>
          </Box>
        )}
        {!lastRan && (
          <Box>
            <Text py={2} fontWeight="bold">
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
