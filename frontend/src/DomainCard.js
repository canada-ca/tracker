import React from 'react'
import { Trans } from '@lingui/macro'
import { Text, ListItem, Box, Icon, Stack, Divider } from '@chakra-ui/core'
import { useHistory } from 'react-router-dom'
import { object, string } from 'prop-types'
import { TrackerButton } from './TrackerButton'

export function DomainCard({ url, lastRan, status, ...rest }) {
  const history = useHistory()
  const generateStatusIcon = (status) => {
    let statusIcon
    if (status === 'PASS') {
      statusIcon = <Icon name="check-circle" color="strong" size="icons.sm" />
    } else if (status === 'FAIL') {
      statusIcon = <Icon name="warning" color="weak" size="icons.sm" />
    } else {
      statusIcon = <Icon name="info" color="info" size="icons.sm" />
    }
    return statusIcon
  }

  return (
    <ListItem {...rest}>
      <Box
        width="100%"
        p="4"
        display={{ md: 'flex' }}
        pl={{ md: '8' }}
        alignItems="center"
      >
        <Box flexShrink="0" w={['100%', '25%']} textAlign="left">
          <Text fontWeight="semibold">
            <Trans>Domain:</Trans>
          </Text>
          <Text isTruncated>{url}</Text>
        </Box>
        <Divider orientation={['horizontal', 'vertical']} />
        <Box
          flexShrink="0"
          w={['100%', '25%']}
          textAlign="left"
          mr={['0', '4']}
        >
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
        {lastRan && (
          <Stack
            justifyContent="space-between"
            flexDirection={['column', 'row']}
          >
            <Box ml={{ md: 2 }} mr={{ md: 2 }} w={['100%', '7%']}>
              <Stack
                align={['right', 'center']}
                flexDirection={['row', 'column']}
              >
                <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
                  HTTPS:
                </Text>
                {generateStatusIcon(status.https)}
              </Stack>
            </Box>
            <Box ml={{ md: 2 }} mr={{ md: 2 }} w={['100%', '7%']}>
              <Stack
                align={['right', 'center']}
                flexDirection={['row', 'column']}
              >
                <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
                  SSL:
                </Text>
                {generateStatusIcon(status.ssl)}
              </Stack>
            </Box>
            <Box ml={{ md: 2 }} mr={{ md: 2 }} w={['100%', '7%']}>
              <Stack
                align={['right', 'center']}
                flexDirection={['row', 'column']}
              >
                <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
                  SPF:
                </Text>
                {generateStatusIcon(status.spf)}
              </Stack>
            </Box>
            <Box ml={{ md: 2 }} mr={{ md: 2 }} w={['100%', '7%']}>
              <Stack
                align={['right', 'center']}
                flexDirection={['row', 'column']}
              >
                <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
                  DKIM:
                </Text>
                {generateStatusIcon(status.dkim)}
              </Stack>
            </Box>
            <Box ml={{ md: 2 }} mr={{ md: 2 }} w={['100%', '7%']}>
              <Stack
                align={['right', 'center']}
                flexDirection={['row', 'column']}
              >
                <Text fontWeight="bold" fontSize="sm" mr={['2', '0']}>
                  DMARC:
                </Text>
                {generateStatusIcon(status.dmarc)}
              </Stack>
            </Box>
            <Divider orientation={['horizontal', 'vertical']} />
          </Stack>
        )}
        <Stack ml={{ md: '10%' }} fontSize="sm">
          <TrackerButton
            variant="primary"
            onClick={() => {
              history.push(
                `/domains/${url}/dmarc-report/LAST30DAYS/${new Date().getFullYear()}`,
              )
            }}
          >
            <Text whiteSpace="noWrap">
              <Trans>DMARC Report</Trans>
            </Text>
          </TrackerButton>
          <TrackerButton
            variant="primary"
            onClick={() => {
              history.push(`/domains/${url}`)
            }}
          >
            <Text whiteSpace="noWrap">
              <Trans>DMARC Guidance</Trans>
            </Text>
          </TrackerButton>
        </Stack>
      </Box>
    </ListItem>
  )
}

DomainCard.propTypes = {
  url: string.isRequired,
  lastRan: string,
  status: object,
}
