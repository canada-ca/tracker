import React, { useEffect, useState } from 'react'
import { Flex, Box, CloseButton, Button, Alert, AlertIcon } from '@chakra-ui/react'

import { any, bool, oneOf } from 'prop-types'
import { CloseIcon } from '@chakra-ui/icons'
import { Trans } from '@lingui/macro'

export function NotificationBanner({ children, hideable = false, bannerId = '', status = 'info', ...props }) {
  const [hideBanner, setHideBanner] = useState(true)

  useEffect(() => {
    if (localStorage.getItem(`hideBanner-${bannerId}`) === 'true') {
      setHideBanner(true)
    } else {
      setHideBanner(false)
    }
  }, [])

  const handleClose = () => {
    setHideBanner(true)
  }

  const handleDontShowAgain = () => {
    localStorage.setItem(`hideBanner-${bannerId}`, 'true')
    setHideBanner(true)
  }

  if (hideBanner) {
    return null
  }

  return (
    <Box {...props} p="2">
      <Alert status={status}>
        <Flex
          maxW={{ sm: 540, md: 768, lg: 960, xl: 1200 }}
          flex="1 0 auto"
          flexDirection={{ base: 'column', lg: 'row' }}
          mx="auto"
          p="0.5rem"
          width="100%"
          align="center"
        >
          <Flex align="center" flexGrow="1">
            <AlertIcon mr={{ base: '1rem', lg: '2rem' }} />
            {children}
          </Flex>
          {hideable && (
            <Flex align="center" mt={{ base: '1rem', lg: 0 }}>
              <Button
                onClick={handleDontShowAgain}
                variant="primaryOutline"
                minWidth="fit-content"
                ml={{ base: 0, lg: '2rem' }}
                mr="2rem"
              >
                <Trans>Don't show again</Trans>
              </Button>
              <CloseButton onClick={handleClose}>
                <CloseIcon h="1rem" w="1rem" />
              </CloseButton>
            </Flex>
          )}
        </Flex>
      </Alert>
    </Box>
  )
}

NotificationBanner.propTypes = {
  hideable: bool,
  bannerId: function (props, _propName, _componentName) {
    if (props.hideable && !props.bannerId) {
      return new Error('`bannerId` is required when `hideable` is true')
    }
    if (props.hideable && typeof props.bannerId !== 'string') {
      return new Error('`bannerId` must be a string')
    }
  },
  status: oneOf(['info', 'warning', 'success', 'error', 'loading']),
  children: any,
}
