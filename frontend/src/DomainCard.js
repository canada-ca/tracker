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
import { object, string } from 'prop-types'
import { slugify } from './slugify'

export function DomainCard({ url, lastRan, status, ...rest }) {
  const history = useHistory()
  const generateStatusIcon = (category) => {
    let statusIcon
    if (category === 'PASS') {
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
        <Box flexShrink="0" w={['100%', '40%']} textAlign="left">
          <Text fontWeight="semibold">
            <Trans>Domain:</Trans>
          </Text>
          <Text isTruncated>{url}</Text>
        </Box>
        <Divider orientation={['horizontal', 'vertical']} />
        <Box flexShrink="0" w={['100%', '15%']} textAlign="left">
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
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }} w={['100%', '7%']}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              HTTPS:
            </Text>
            {status?.https
              ? generateStatusIcon(status.https)
              : generateStatusIcon('FAIL')}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }} w={['100%', '7%']}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              SSL:
            </Text>
            {status?.ssl
              ? generateStatusIcon(status.ssl)
              : generateStatusIcon('FAIL')}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }} w={['100%', '7%']}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              SPF:
            </Text>
            {status?.spf
              ? generateStatusIcon(status.spf)
              : generateStatusIcon('FAIL')}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }} w={['100%', '7%']}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              DKIM:
            </Text>
            {status?.dkim
              ? generateStatusIcon(status.dkim)
              : generateStatusIcon('FAIL')}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }} w={['100%', '7%']}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              DMARC:
            </Text>
            {status?.dmarc
              ? generateStatusIcon(status.dmarc)
              : generateStatusIcon('FAIL')}
          </Stack>
        </Box>
      </PseudoBox>
    </ListItem>
  )
}

DomainCard.propTypes = {
  url: string.isRequired,
  lastRan: string,
  status: object,
}
