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
import { useLingui } from '@lingui/react'
import { useHistory } from 'react-router-dom'
import { string } from 'prop-types'
import { slugify } from './slugify'

export function DomainCard({ url, lastRan, ...rest }) {
  const history = useHistory()
  const { i18n } = useLingui()
  const webProtocols = [
    'HTTPS',
    'HSTS',
    i18n._(t`HSTS Preloaded`),
    'SSL',
    i18n._(t`Protocols & Ciphers`),
    i18n._(t`Certificate Use`),
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
        tabIndex={0}
      >
        <Tooltip label={url} placement="left">
          <Box flexShrink="0" minW="13%" maxW={['100%', '13%']}>
            <Text fontWeight="semibold">
              <Trans>Domain:</Trans>
            </Text>
            <Text isTruncated>{url}</Text>
          </Box>
        </Tooltip>
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
                {generateWebStatusIcon()}
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
  lastRan: string,
}
