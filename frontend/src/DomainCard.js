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

export function DomainCard({ url, lastRan, web, email, ...rest }) {
  const history = useHistory()
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

  let implementation = ''
  let enforced = ''
  let hsts = ''
  let preloaded = ''
  let dmarcPhase = 0

  web?.https?.edges[0] &&
    ({ implementation, enforced, hsts, preloaded } = web.https.edges[0].node)
  email?.dmarc?.edges[0] && ({ dmarcPhase } = email?.dmarc?.edges[0]?.node)

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
              {lastRan}
            </Box>
          ) : (
            <Text fontWeight="bold" fontSize="sm">
              <Trans>Not scanned yet.</Trans>
            </Text>
          )}
        </Box>
        <Divider orientation={['horizontal', 'vertical']} />
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              {t`HTTPS Implemented`}:
            </Text>
            {implementation === 'Valid HTTPS' ? (
              <Icon name="check-circle" color="strong" size="icons.sm" />
            ) : (
              <Icon name="warning" color="weak" size="icons.sm" />
            )}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              {t`HTTPS Enforced`}:
            </Text>
            {enforced === 'Strict' ? (
              <Icon name="check-circle" color="strong" size="icons.sm" />
            ) : (
              <Icon name="warning" color="weak" size="icons.sm" />
            )}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              HSTS:
            </Text>
            {hsts === 'HSTS Fully Implemented' ? (
              <Icon name="check-circle" color="strong" size="icons.sm" />
            ) : (
              <Icon name="warning" color="weak" size="icons.sm" />
            )}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              {t`HSTS Preloaded`}:
            </Text>
            {preloaded === 'HSTS Preloaded' ? (
              <Icon name="check-circle" color="strong" size="icons.sm" />
            ) : (
              <Icon name="warning" color="weak" size="icons.sm" />
            )}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              SSL:
            </Text>
            {generateWebStatus()}
          </Stack>
        </Box>
        {/* <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              {t`Protocols & Ciphers`}:
            </Text>
            {generateWebStatus()}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              {t`Certificate Use`}:
            </Text>
            {generateWebStatus()}
          </Stack>
        </Box> */}
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              SPF:
            </Text>
            {generateWebStatus()}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              DKIM:
            </Text>
            {generateWebStatus()}
          </Stack>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Stack align={['right', 'center']} flexDirection={['row', 'column']}>
            <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
              DMARC:
            </Text>
            {dmarcPhase === 4 ? (
              <Icon name="check-circle" color="strong" size="icons.sm" />
            ) : (
              <Icon name="warning" color="weak" size="icons.sm" />
            )}
          </Stack>
        </Box>
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
