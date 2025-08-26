import React, { useRef } from 'react'
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Switch,
  Tooltip,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { useMutation } from '@apollo/client'
import { Trans, t } from '@lingui/macro'
import { UPDATE_USER_PROFILE } from '../graphql/mutations'
import { useUserVar } from '../utilities/userState'
import { object } from 'prop-types'
import { RadioCheckedIcon, RadioUncheckedIcon } from '../theme/Icons'
import { Formik } from 'formik'
import { EditIcon, QuestionOutlineIcon } from '@chakra-ui/icons'

export function EditableEmailUpdateOptions({ emailUpdateOptions, ...props }) {
  const toast = useToast()
  const { login, currentUser } = useUserVar()
  const initialFocusRef = useRef()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [updateUserProfile, { error: _updateUserProfileError }] = useMutation(UPDATE_USER_PROFILE, {
    onError: ({ message }) => {
      toast({
        title: t`An error occurred while updating your email update preference.`,
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ updateUserProfile }) {
      if (updateUserProfile.result.__typename === 'UpdateUserProfileResult') {
        toast({
          title: t`Email Updates status changed`,
          description: t`You have successfully updated your email update preference.`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        login({
          ...currentUser,
          emailUpdateOptions: updateUserProfile.result.user.emailUpdateOptions,
        })
      } else if (updateUserProfile.result.__typename === 'UpdateUserProfileError') {
        toast({
          title: t`Unable to update to your Email Updates status, please try again.`,
          description: updateUserProfile.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect update method received.`,
          description: t`Incorrect updateUserProfile.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect updateUserProfile.result typename.')
      }
    },
  })

  return (
    <Box {...props} p="1">
      <Heading as="h3" size="md" mb="1">
        <Trans>Email Update Preferences:</Trans>
      </Heading>

      <Flex align="center" borderWidth="1px" borderColor="gray.500" rounded="md" p="1">
        {emailUpdateOptions.orgFootprint ? (
          <RadioCheckedIcon boxSize="icons.lg" mr="2" />
        ) : (
          <RadioUncheckedIcon boxSize="icons.lg" mr="2" />
        )}
        <Badge variant="outline" color="gray.900" p="1" mr="4">
          <Trans>Recent Activity</Trans>
        </Badge>

        {emailUpdateOptions.progressReport ? (
          <RadioCheckedIcon boxSize="icons.lg" mr="2" />
        ) : (
          <RadioUncheckedIcon boxSize="icons.lg" mr="2" />
        )}
        <Badge variant="outline" color="gray.900" p="1">
          <Trans>Progress Report</Trans>
        </Badge>

        {emailUpdateOptions.detectDecay ? (
          <RadioCheckedIcon boxSize="icons.lg" mr="2" />
        ) : (
          <RadioUncheckedIcon boxSize="icons.lg" mr="2" />
        )}
        <Badge variant="outline" color="gray.900" p="1" mr="4">
          <Trans>Decay Detection</Trans>
        </Badge>
        <Button variant="primary" ml="auto" onClick={onOpen} fontSize="sm" px="3">
          <EditIcon color="white" mr="2" boxSize="1rem" />
          <Trans>Edit</Trans>
        </Button>
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose} initialFocusRef={initialFocusRef} motionPreset="slideInBottom">
        <ModalOverlay />
        <ModalContent pb="4">
          <Formik
            initialValues={{ ...emailUpdateOptions }}
            onSubmit={async (values) => {
              // Submit update detail mutation
              await updateUserProfile({
                variables: {
                  emailUpdateOptions: {
                    orgFootprint: values.orgFootprint,
                    progressReport: values.progressReport,
                    detectDecay: values.detectDecay,
                  },
                },
              })
            }}
          >
            {({ handleChange, handleSubmit, isSubmitting }) => (
              <form id="form" onSubmit={handleSubmit}>
                <ModalHeader>
                  <Trans>Edit Email Update Preferences</Trans>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Stack spacing="4" p="6">
                    <Flex align="center">
                      <Tooltip
                        label={t`For organization admins interested in receiving email updates on new activity in their organizations.`}
                      >
                        <QuestionOutlineIcon tabIndex={0} />
                      </Tooltip>
                      <label>
                        <Switch
                          name="orgFootprint"
                          isFocusable={true}
                          id="orgFootprint"
                          aria-label="Recent Activity"
                          mx="2"
                          defaultChecked={emailUpdateOptions.orgFootprint}
                          onChange={handleChange}
                        />
                      </label>
                      <Badge variant="outline" color="gray.900" p="1">
                        <Trans>Recent Activity</Trans>
                      </Badge>
                    </Flex>
                    <Flex align="center">
                      <Tooltip
                        label={t`For organization admins interested in receiving monthly email updates how their organization is progressing to 100% compliance.`}
                      >
                        <QuestionOutlineIcon tabIndex={0} />
                      </Tooltip>
                      <label>
                        <Switch
                          name="progressReport"
                          isFocusable={true}
                          id="progressReport"
                          aria-label="Progress Report"
                          mx="2"
                          defaultChecked={emailUpdateOptions.progressReport}
                          onChange={handleChange}
                        />
                      </label>
                      <Badge variant="outline" color="gray.900" p="1">
                        <Trans>Progress Report</Trans>
                      </Badge>
                    </Flex>
                    <Flex align="center">
                      <Tooltip
                        label={t`For organization admins interested in receiving email updates on new changes to their organization's compliance statuses.`}
                      >
                        <QuestionOutlineIcon tabIndex={0} />
                      </Tooltip>
                      <label>
                        <Switch
                          name="detectDecay"
                          isFocusable={true}
                          id="detectDecay"
                          aria-label="Decay Detection"
                          mx="2"
                          defaultChecked={emailUpdateOptions.detectDecay}
                          onChange={handleChange}
                        />
                      </label>
                      <Badge variant="outline" color="gray.900" p="1">
                        <Trans>Decay Detection</Trans>
                      </Badge>
                    </Flex>
                  </Stack>
                </ModalBody>

                <ModalFooter>
                  <Button variant="primary" isLoading={isSubmitting} type="submit" mr="4">
                    <Trans>Confirm</Trans>
                  </Button>
                </ModalFooter>
              </form>
            )}
          </Formik>
        </ModalContent>
      </Modal>
    </Box>
  )
}

EditableEmailUpdateOptions.propTypes = {
  emailUpdateOptions: object,
}
