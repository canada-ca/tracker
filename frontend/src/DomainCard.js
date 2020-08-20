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
import { useHistory } from 'react-router-dom'
import { string } from 'prop-types'
import { slugify } from './slugify'

export function DomainCard({ url, lastRan, ...rest }) {
  const history = useHistory()
  const webProtocols = [
    'HTTPS',
    'HSTS',
    'HSTS Preloaded',
    'SSL',
    'Protocols & Ciphers',
    'Certificate Use',
  ]
  const emailProtocols = ['SPF', 'DKIM', 'DMARC']

  const generateWebStatusIcon = () => {
    const randNum = Math.floor(Math.random() * 100 + 1)
    let statusIcon
    if (randNum < 70) {
      statusIcon = <Icon name="check-circle" color="strong" size="icons.sm" />
    } else {
      statusIcon = <Icon name="warning" color="weak" size="icons.sm" />
    }
    return statusIcon
  }

  const generateEmailStatusIcon = () => {
    const randNum = Math.floor(Math.random() * 100 + 1)
    let statusIcon
    if (randNum < 33) {
      statusIcon = <Icon name="check-circle" color="strong" size="icons.sm" />
    } else if (randNum >= 33 && randNum < 66) {
      statusIcon = <Icon name="warning-2" color="moderate" size="icons.sm" />
    } else {
      statusIcon = <Icon name="warning" color="weak" size="icons.sm" />
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
          history.push(`/domains/${slugify(url)}`)
        }}
        _hover={{ bg: 'gray.100' }}
        p="8"
      >
        <Box flexShrink="0" minW="12%">
          <Text fontWeight="semibold">Domain:</Text>
          {url}
        </Box>
        <Divider orientation={['horizontal', 'vertical']} />
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          {lastRan ? (
            <Box>
              <Text fontWeight="bold">
                <Trans>Last scanned:</Trans>
              </Text>
              {lastRan}
            </Box>
          ) : (
            <Text fontWeight="bold" fontSize="sm">
              <Trans>Not scanned yet.</Trans>
            </Text>
          )}
        </Box>
        <Divider orientation={['horizontal', 'vertical']} />
        {webProtocols.map(protocol => {
          return (
            <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }} key={protocol}>
              <Stack
                align={['right', 'center']}
                flexDirection={['row', 'column']}
              >
                <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
                  {protocol}:
                </Text>
                {generateWebStatusIcon()}
              </Stack>
            </Box>
          )
        })}
        {emailProtocols.map(protocol => {
          return (
            <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }} key={protocol}>
              <Stack
                align={['right', 'center']}
                flexDirection={['row', 'column']}
              >
                <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
                  {protocol}:
                </Text>
                {generateEmailStatusIcon()}
              </Stack>
            </Box>
          )
        })}
      </PseudoBox>
    </ListItem>
  )
}

DomainCard.propTypes = {
  url: string.isRequired,
  lastRan: string.isRequired,
}
