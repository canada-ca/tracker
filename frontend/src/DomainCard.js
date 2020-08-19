import React from 'react'
import { Trans } from '@lingui/macro'
import {
  Text,
  ListItem,
  PseudoBox,
  Box,
  Icon,
  Stack,
  Divider,
} from '@chakra-ui/core'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { string } from 'prop-types'
import { slugify } from './slugify'

export function DomainCard({ url, lastRan, ...rest }) {
  const history = useHistory()
  const { path, _url } = useRouteMatch()

  const generateWebStatusIcon = () => {
    const randNum = Math.floor(Math.random() * 100 + 1)
    let statusIcon
    if (randNum < 70) {
      statusIcon = <Icon name="check" color="strong" />
    } else {
      statusIcon = <Icon name="warning" color="weak" />
    }
    return statusIcon
  }

  const generateEmailStatusIcon = () => {
    const randNum = Math.floor(Math.random() * 100 + 1)
    let statusIcon
    if (randNum < 33) {
      statusIcon = <Icon name="check" color="strong" />
    } else if (randNum >= 33 && randNum < 66) {
      statusIcon = <Icon name="warning-2" color="moderate" />
    } else {
      statusIcon = <Icon name="warning" color="weak" />
    }
    return statusIcon
  }

  return (
    <ListItem {...rest}>
      <PseudoBox
        width="100%"
        display={{ md: 'flex' }}
        alignItems="center"
        onClick={() => {
          history.push(`${path}/${slugify(url)}`)
        }}
        _hover={{ borderColor: 'gray.100', bg: 'gray.100' }}
        p="8"
      >
        <Box flexShrink="0" minW="15%">
          <Text fontSize="xl">{url}</Text>
        </Box>
        <Divider orientation="vertical" />
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
        <Divider orientation="vertical" />
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">HTTPS</Text>
            {generateWebStatusIcon()}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">HSTS</Text>
            {generateWebStatusIcon()}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">HSTS Preloaded</Text>
            {generateWebStatusIcon()}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">SSL</Text>
            {generateWebStatusIcon()}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">Protocols & Ciphers</Text>
            {generateWebStatusIcon()}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">Certificate Use</Text>
            {generateWebStatusIcon()}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">SPF</Text>
            {generateEmailStatusIcon()}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">DKIM</Text>
            {generateEmailStatusIcon()}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align="center">
            <Text fontWeight="bold">DMARC</Text>
            {generateEmailStatusIcon()}
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
