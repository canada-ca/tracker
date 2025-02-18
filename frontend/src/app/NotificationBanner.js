import React, { useEffect, useState } from 'react'
import { Flex, Box, CloseButton, Button, Alert, AlertIcon, useToast } from '@chakra-ui/react'

import { any, bool, oneOf, string } from 'prop-types'
import { CloseIcon } from '@chakra-ui/icons'
import { t, Trans } from '@lingui/macro'
import { useMutation } from '@apollo/client'
import { DISMISS_MESSAGE } from '../graphql/mutations'
import { useUserVar } from '../utilities/userState'

export function NotificationBanner({ children, hideable = false, bannerId, status = 'info', ...props }) {
  const toast = useToast()
  const { login, currentUser, isLoggedIn } = useUserVar()

  function checkHideBanner({ dismissedMessages }) {
    const dismissedMessage = dismissedMessages.find((message) => message.messageId === bannerId)
    return !!dismissedMessage
  }

  const [hideBanner, setHideBanner] = useState(
    checkHideBanner({ dismissedMessages: currentUser?.dismissedMessages || [], userLoggedIn: isLoggedIn() }),
  )

  const [dismissMessage, { loading, _error }] = useMutation(DISMISS_MESSAGE, {
    onError: ({ message }) => {
      toast({
        title: t`An error occurred when dismissing the message.`,
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ dismissMessage }) {
      if (dismissMessage.result.__typename === 'DismissMessageResult') {
        toast({
          title: t`Message dismissed successfully`,
          description: t`The message has been dismissed and will not be shown again.`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        login({
          ...currentUser,
          dismissedMessages: dismissMessage.result.user.dismissedMessages,
        })
      } else if (dismissMessage.result.__typename === 'DismissMessageError') {
        toast({
          title: t`Unable to dismiss the message.`,
          description: dismissMessage.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect dismiss method received.`,
          description: t`Incorrect dismissMessage.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      }
    },
  })

  useEffect(() => {
    const shouldHideBanner = checkHideBanner({
      dismissedMessages: currentUser?.dismissedMessages || [],
      userLoggedIn: isLoggedIn(),
    })

    if (shouldHideBanner !== hideBanner) {
      setHideBanner(shouldHideBanner)
    }
  }, [currentUser?.dismissedMessages])

  const handleClose = () => {
    setHideBanner(true)
  }

  const handleDontShowAgain = async () => {
    await dismissMessage({
      variables: {
        messageId: bannerId,
      },
    })
  }

  if (hideBanner) {
    return null
  }

  return (
    <Box {...props} py="2">
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
              {bannerId && isLoggedIn() && (
                <Button
                  onClick={handleDontShowAgain}
                  variant="primaryOutline"
                  minWidth="fit-content"
                  isLoading={loading}
                  ml={{ base: 0, lg: '2rem' }}
                  mr="2rem"
                >
                  <Trans>Don't show again</Trans>
                </Button>
              )}
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
  bannerId: string,
  status: oneOf(['info', 'warning', 'success', 'error', 'loading']),
  children: any,
}
