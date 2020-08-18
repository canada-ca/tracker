import React from 'react'
import { Trans } from '@lingui/macro'
import {
  Text,
  ListItem,
  Progress,
  PseudoBox,
  Box,
  Link,
  Icon,
  Stack,
} from '@chakra-ui/core'
import { useHistory } from 'react-router-dom'
import { string } from 'prop-types'
import { sanitizeUrl } from './sanitizeUrl'
import { slugify } from './slugify'

export function DomainCard({ url, lastRan, ...rest }) {
  const history = useHistory()
  return (
    <ListItem {...rest}>
      <PseudoBox
        width="100%"
        display={{ md: 'flex' }}
        alignItems="center"
        onClick={() => {
          history.push(`domains/${slugify(url)}`)
        }}
        _hover={{ borderColor: 'gray.100', bg: 'gray.100' }}
        p="8"
      >
        <Box flexShrink="0" minW="15%">
          {/* <Link
            // TODO: have the API enforce a scheme
            // so we don't need to guess badly here.
            href={`http://${sanitizeUrl(url)}`}
            isExternal
            target="_blank"
            rel="noopener noreferrer"
          >
            {url}
            <Icon name="external-link" mx="2px" />
          </Link> */}
          <Text>{url}</Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          {lastRan ? (
            <Box>
              <Text fontWeight="bold">
                <Trans>Last scanned:</Trans>
              </Text>
              {lastRan}
            </Box>
          ) : (
            <Text fontWeight="bold">
              <Trans>Not scanned yet.</Trans>
            </Text>
          )}
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">HTTPS</Text>
            <Icon name="check" color="strong" />
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">HSTS</Text>
            <Icon name="check" color="strong" />
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">HSTS Preloaded</Text>
            <Icon name="check" color="strong" />
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">SSL</Text>
            <Icon name="check" color="strong" />
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">Protocols & Ciphers</Text>
            <Icon name="check" color="strong" />
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">Certificate Use</Text>
            <Icon name="check" color="strong" />
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">SPF</Text>
            <Icon name="check" color="strong" />
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">DKIM</Text>
            <Icon name="check" color="strong" />
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">DMARC</Text>
            <Icon name="check" color="strong" />
          </Stack>
        </Box>
      </PseudoBox>
    </ListItem>
  )
}

DomainCard.propTypes = {
  url: string.isRequired,
  lastRan: string.isRequired,
}
