import React, { useState } from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  Stack,
  Text,
  Icon,
  useToast,
  useDisclosure,
  SlideIn,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
} from '@chakra-ui/core'
import { string } from 'prop-types'
import { TrackerButton } from './TrackerButton'
import { useMutation } from '@apollo/client'
import { REMOVE_DOMAIN } from './graphql/mutations'
import { useUserState } from './UserState'

export function RemoveDomainButton({ url, orgName }) {
  const toast = useToast()
  const { i18n } = useLingui()
  const {
    isOpen: removeIsOpen,
    onOpen: removeOnOpen,
    onClose: removeOnClose,
  } = useDisclosure()
  const [selectedRemoveDomain, setSelectedRemoveDomain] = useState()
  const { currentUser } = useUserState()

  const [removeDomain, { loading: removeDomainLoading }] = useMutation(
    REMOVE_DOMAIN,
    {
      context: {
        headers: {
          authorization: currentUser.jwt,
        },
      },
      refetchQueries: ['Domains'],
      onError(error) {
        toast({
          title: i18n._(t`An error occurred.`),
          description: error.message,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'bottom-left',
        })
      },
      onCompleted() {
        removeOnClose()
        toast({
          title: i18n._(t`Domain removed`),
          description: i18n._(t`Domain removed from ${orgName}`),
          status: 'info',
          duration: 9000,
          isClosable: true,
          position: 'bottom-left',
        })
      },
    },
  )

  return (
    <>
      <TrackerButton
        onClick={() => {
          setSelectedRemoveDomain(url)
          removeOnOpen()
        }}
        variant="danger"
        px="2"
        fontSize="xs"
      >
        <Icon name="minus" />
      </TrackerButton>

      <SlideIn in={removeIsOpen}>
        {styles => (
          <Modal isOpen={true} onClose={removeOnClose}>
            <ModalOverlay opacity={styles.opacity} />
            <ModalContent pb={4} {...styles}>
              <ModalHeader>
                <Trans>Remove Domain</Trans>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Stack spacing={4} p={25}>
                  <Text>
                    <Trans>Confirm removal of domain:</Trans>
                  </Text>
                  <Text fontWeight="bold">{selectedRemoveDomain}</Text>
                </Stack>
              </ModalBody>

              <ModalFooter>
                <TrackerButton
                  variant="primary"
                  isLoading={removeDomainLoading}
                  mr={4}
                  onClick={() =>
                    removeDomain({
                      variables: { url: selectedRemoveDomain },
                    })
                  }
                >
                  <Trans>Confirm</Trans>
                </TrackerButton>
                <Button
                  color="primary"
                  bg="transparent"
                  borderColor="primary"
                  borderWidth="1px"
                  variant="outline"
                  onClick={removeOnClose}
                >
                  <Trans>Close</Trans>
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </SlideIn>
    </>
  )
}

RemoveDomainButton.propTypes = {
  url: string,
  orgName: string,
}
