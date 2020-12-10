import React from 'react'
import { t, Trans } from '@lingui/macro'
import {
  Text,
  ListItem,
  PseudoBox,
  Box,
  Icon,
  Stack,
  Divider,
  Tooltip,
} from '@chakra-ui/core'
import { useHistory } from 'react-router-dom'
import { object, string } from 'prop-types'
import { slugify } from './slugify'

export function DomainCard({ url, lastRan, ...rest }) {
  const history = useHistory()
  const webProtocols = [
    'HTTPS',
    'HSTS',
    t`HSTS Preloaded`,
    'SSL',
    t`Protocols & Ciphers`,
    t`Certificate Use`,
  ]
  const emailProtocols = ['SPF', 'DKIM', 'DMARC']

  const generateWebStatus = () => {
    const randNum = Math.floor(Math.random() * 100 + 1)
    let statusIcon
    if (randNum < 70) {
      statusIcon = <Icon name="check-circle" color="strong" size="icons.sm" />
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
        as="button"
      >
        <Tooltip label={url} placement="left">
          <Box flexShrink="0" w={['100%', '13%']} textAlign="left">
            <Text fontWeight="semibold">
              <Trans>Domain:</Trans>
            </Text>
            <Text isTruncated>{url}</Text>
          </Box>
        </Tooltip>
        <Divider orientation={['horizontal', 'vertical']} />
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }} textAlign="left">
          {lastRan ? (
            <Box>
              <Text fontWeight="bold">
                <Trans>Last scanned:</Trans>
              </Text>
              {lastRan.substring(0, 16)}
            </Box>
          ) : (
            <Text fontWeight="bold" fontSize="sm">
              <Trans>Not scanned yet.</Trans>
            </Text>
          )}
        </Box>
        <Divider orientation={['horizontal', 'vertical']} />
        {webProtocols.map((protocol) => {
          return (
            <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }} key={protocol}>
              <Stack
                align={['right', 'center']}
                flexDirection={['row', 'column']}
              >
                <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
                  {protocol}:
                </Text>
                {generateWebStatus()}
              </Stack>
            </Box>
          )
        })}
        {emailProtocols.map((protocol) => {
          return (
            <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }} key={protocol}>
              <Stack
                align={['right', 'center']}
                flexDirection={['row', 'column']}
              >
                <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
                  {protocol}:
                </Text>
                {generateWebStatus()}
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
  lastRan: string,
  web: object,
  email: object,
}
