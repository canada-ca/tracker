import React from 'react'
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SlideIn,
  Stack,
  Text,
} from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import PasswordField from './PasswordField'
import WithPseudoBox from './withPseudoBox'
import {
  bool,
  element,
  func,
  object,
  oneOfType,
  shape,
  string,
} from 'prop-types'

function ConfirmPasswordModal({
  isOpen,
  onClose,
  initialFocusRef,
  finalFocusRef,
  isSubmitting,
  values,
  ..._props
}) {
  return (
    <SlideIn in={isOpen}>
      {styles => (
        <Modal
          initialFocusRef={initialFocusRef}
          finalFocusRef={finalFocusRef}
          isOpen={true}
          onClose={onClose}
        >
          <ModalOverlay opacity={styles.opacity} />
          <ModalContent pb={4} {...styles}>
            <ModalHeader>
              <Trans>Confirm Current Password</Trans>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={8}>
                <Text>
                  <Trans>
                    Please enter your current password for verification.
                  </Trans>
                </Text>
                <PasswordField
                  name="currentPassword"
                  label="Current Password:"
                  ref={initialFocusRef}
                />
              </Stack>
            </ModalBody>

            <ModalFooter>
              <Button
                variantColor="teal"
                isLoading={isSubmitting}
                type="submit"
                id="submitBtn"
                mr={4}
              >
                <Trans>Confirm</Trans>
              </Button>
              <Button
                variantColor="teal"
                variant="outline"
                onClick={() => {
                  // Clear current password section when closing modal
                  values.currentPassword = ''
                  onClose()
                }}
              >
                <Trans>Close</Trans>
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </SlideIn>
  )
}

ConfirmPasswordModal.propTypes = {
  isOpen: bool.isRequired,
  onClose: func.isRequired,
  initialFocusRef: oneOfType([func, shape({ current: object })]),
  finalFocusRef: oneOfType([func, shape({ current: object })]),
  isSubmitting: bool,
  values: shape({ currentPassword: string }).isRequired,
}

export default WithPseudoBox(ConfirmPasswordModal)
