import React from 'react'
import { string } from 'prop-types'
import {
  IconButton,
  useToast,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Button,
  Text,
  Stack,
  useDisclosure,
} from '@chakra-ui/react'
import { Search2Icon } from '@chakra-ui/icons'
import { useMutation } from '@apollo/client'
import { REQUEST_DISCOVERY } from '../graphql/mutations'
import { Trans, t } from '@lingui/macro'

export function SubdomainDiscoveryButton({ orgId, orgSlug, domainUrl, ...props }) {
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [requestScan, { _loading, _error }] = useMutation(REQUEST_DISCOVERY, {
    onError: ({ message }) => {
      toast({
        title: t`An error occurred while requesting subdomain discovery.`,
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted() {
      onClose()
      toast({
        title: t`Requested subdomain scan`,
        description: t`You have successfully requested subdomain discovery.`,
        status: 'success',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  return (
    <>
      <IconButton
        variant="primary"
        colorScheme="teal"
        icon={<Search2Icon />}
        aria-label={`Request subdomain discovery for ${domainUrl}`}
        onClick={onOpen}
        {...props}
      />
      <Modal isOpen={isOpen} onClose={onClose} motionPreset="slideInBottom">
        <ModalOverlay />
        <ModalContent pb={4}>
          <ModalHeader>
            <Trans>Discover Subdomains</Trans>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4} p={25}>
              <Text>
                <Trans>
                  Confirm subdomain discovery for <b>{domainUrl}</b>:
                </Trans>
              </Text>
              <Text>
                <Trans>
                  Domains found through this method will be automatically added to <b>{orgSlug}</b> and tagged as "NEW".
                  Would you like to proceed?
                </Trans>
              </Text>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="primary"
              mr={4}
              onClick={async () => {
                await requestScan({ variables: { orgId, domainUrl } })
              }}
            >
              <Trans>Confirm</Trans>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

SubdomainDiscoveryButton.propTypes = {
  orgId: string.isRequired,
  domainUrl: string.isRequired,
  orgSlug: string.isRequired,
}
