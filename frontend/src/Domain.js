import React from 'react'
import { Trans } from '@lingui/macro'
import { string } from 'prop-types'
import { Box, Link, ListItem, Stack, Text } from '@chakra-ui/react'
import { ExternalLinkIcon, LinkIcon } from '@chakra-ui/icons'
import { sanitizeUrl } from './sanitizeUrl'
import { Link as RouteLink } from 'react-router-dom'

export function Domain({ url, lastRan, ...rest }) {
  return (
    <ListItem {...rest}>
      <Stack spacing={4} padding={[1, 2, 3]}>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Domain:</Trans>
          </Text>
          <Link
            ml="auto"
            // TODO: have the API enforce a scheme
            // so we don't need to guess badly here.
            href={`http://${sanitizeUrl(url)}`}
            isExternal
            target="_blank"
            rel="noopener noreferrer"
          >
            {url}
            <ExternalLinkIcon mx="2px" />
          </Link>
        </Stack>
        {lastRan && (
          <Stack isInline align="flex-end" mt="auto">
            <Text fontWeight="bold" flexBasis="0px" flexGrow={1}>
              <Trans>Last scanned:</Trans>
            </Text>
            <Link as={RouteLink} to={`domains/${url}`}>
              {lastRan}
              <LinkIcon mx="2px" />
            </Link>
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
    </ListItem>
  )
}
Domain.propTypes = { url: string, lastRan: string }
