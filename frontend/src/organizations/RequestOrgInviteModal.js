import React from 'react'
import { REQUEST_INVITE_TO_ORG } from '../graphql/mutations'
import { useMutation } from '@apollo/client'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useToast,
} from '@chakra-ui/react'
import { Trans, t } from '@lingui/macro'
import { bool } from 'prop-types'
import { func } from 'prop-types'
import { string } from 'prop-types'

export function RequestOrgInviteModal({ isOpen, onClose, orgId, orgName }) {
  const toast = useToast()
  const [requestInviteToOrg, { loading }] = useMutation(REQUEST_INVITE_TO_ORG, {
    onError(error) {
      toast({
        title: error.message,
        description: t`Unable to request invite, please try again.`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ requestOrgAffiliation }) {
      if (requestOrgAffiliation.result.__typename === 'InviteUserToOrgResult') {
        toast({
          title: t`Invite Requested`,
          description: t`Your request has been sent to the organization administrators.`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Unable to request invite, please try again.`,
          description: requestOrgAffiliation.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      }
    },
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Trans>Request Invite</Trans>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Trans>Would you like to request an invite to {orgName}?</Trans>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="primary"
            isLoading={loading}
            onClick={async () => requestInviteToOrg({ variables: { orgId } })}
          >
            <Trans>Confirm</Trans>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

RequestOrgInviteModal.propTypes = {
  isOpen: bool,
  onClose: func,
  orgId: string,
  orgName: string,
}
