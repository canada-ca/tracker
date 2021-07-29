import React, { useRef, useState } from 'react'
import { string } from 'prop-types'
import {
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
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { PhoneIcon } from '@chakra-ui/icons'
import { Formik } from 'formik'
import { t, Trans } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { SET_PHONE_NUMBER, VERIFY_PHONE_NUMBER } from './graphql/mutations'
import { useMutation } from '@apollo/client'
import { number, object, string as yupString } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import PhoneNumberField from './PhoneNumberField'
import AuthenticateField from './AuthenticateField'

export default function EditableUserPhoneNumber({ detailValue }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const initialFocusRef = useRef()
  const verifyRef = useRef()

  const [phoneCodeSent, setPhoneCodeSent] = useState(false)

  const [setPhoneNumber, { error: _setPhoneNumberError }] = useMutation(
    SET_PHONE_NUMBER,
    {
      onError: ({ message }) => {
        toast({
          title: t`An error occurred while updating your phone number.`,
          description: message,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
      onCompleted({ setPhoneNumber }) {
        if (setPhoneNumber.result.__typename === 'SetPhoneNumberResult') {
          setPhoneCodeSent(true)
        } else if (setPhoneNumber.result.__typename === 'SetPhoneNumberError') {
          toast({
            title: t`Unable to update your phone number, please try again.`,
            description: setPhoneNumber.result.description,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else {
          toast({
            title: t`Incorrect send method received.`,
            description: t`Incorrect setPhoneNumber.result typename.`,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          console.log('Incorrect setPhoneNumber.result typename.')
        }
      },
    },
  )

  const [verifyPhoneNumber, { error: __verifyPhoneNumberError }] = useMutation(
    VERIFY_PHONE_NUMBER,
    {
      onError: ({ message }) => {
        toast({
          title: t`An error occurred while verifying your phone number.`,
          description: message,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
      onCompleted({ verifyPhoneNumber }) {
        if (verifyPhoneNumber.result.__typename === 'VerifyPhoneNumberResult') {
          toast({
            title: t`Changed User Phone Number`,
            description: t`You have successfully updated your phone number.`,
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          onClose()
          setPhoneCodeSent(false)
        } else if (
          verifyPhoneNumber.result.__typename === 'VerifyPhoneNumberError'
        ) {
          toast({
            title: t`Unable to verify your phone number, please try again.`,
            description: verifyPhoneNumber.result.description,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else {
          toast({
            title: t`Incorrect send method received.`,
            description: t`Incorrect verifyPhoneNumber.result typename.`,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          console.log('Incorrect verifyPhoneNumber.result typename.')
        }
      },
    },
  )

  const PHONE_NUMBER_REGEX = /^[1-9]\d{9,14}$/

  const phoneValidationSchema = object().shape({
    phoneNumber: yupString()
      .required(i18n._(fieldRequirements.phoneNumber.required.message))
      .matches(
        PHONE_NUMBER_REGEX,
        i18n._(fieldRequirements.phoneNumber.matches.message),
      ),
  })

  const tfaValidationSchema = object().shape({
    twoFactorCode: number()
      .typeError(i18n._(fieldRequirements.twoFactorCode.typeError))
      .required(i18n._(fieldRequirements.twoFactorCode.required)),
  })

  const setPhoneModal = (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      initialFocusRef={initialFocusRef}
      motionPreset="slideInBottom"
    >
      <ModalOverlay />
      <ModalContent pb="4">
        <Formik
          key="setPhoneNumberFormKey"
          validateOnBlur={false}
          initialValues={{
            phoneNumber: '',
          }}
          validationSchema={phoneValidationSchema}
          onSubmit={async (values) => {
            // Submit update detail mutation
            await setPhoneNumber({
              variables: {
                phoneNumber: '+' + values.phoneNumber,
              },
            })
          }}
        >
          {({ handleSubmit, isSubmitting }) => (
            <form id="form" onSubmit={handleSubmit}>
              <ModalHeader>
                <Trans>Edit Phone Number</Trans>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Stack spacing="4" p="6">
                  {detailValue && (
                    <Stack>
                      <Heading as="h3" size="sm">
                        <Trans>Current Phone Number:</Trans>
                      </Heading>

                      <Text>{detailValue}</Text>
                    </Stack>
                  )}

                  <PhoneNumberField
                    name="phoneNumber"
                    label={t`New Phone Number:`}
                  />
                </Stack>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="primary"
                  isLoading={isSubmitting}
                  type="submit"
                  mr="4"
                >
                  <Trans>Confirm</Trans>
                </Button>
              </ModalFooter>
            </form>
          )}
        </Formik>
      </ModalContent>
    </Modal>
  )

  const verifyPhoneModal = (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      initialFocusRef={initialFocusRef}
      motionPreset="slideInBottom"
    >
      <ModalOverlay />
      <ModalContent pb="4">
        <Formik
          key="verifyPhoneNumberFormKey"
          validateOnBlur={false}
          initialValues={{
            twoFactorCode: '',
          }}
          validationSchema={tfaValidationSchema}
          onSubmit={async (values) => {
            // Submit update detail mutation
            await verifyPhoneNumber({
              variables: {
                twoFactorCode: parseInt(values.twoFactorCode),
              },
            })
          }}
        >
          {({ handleSubmit, isSubmitting }) => (
            <form id="form" onSubmit={handleSubmit}>
              <ModalHeader>
                <Trans>Verify</Trans>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Stack spacing="4" p="6">
                  <AuthenticateField
                    name="twoFactorCode"
                    mb="4"
                    sendMethod={'verifyPhone'}
                    ref={verifyRef}
                  />
                </Stack>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="primary"
                  isLoading={isSubmitting}
                  type="submit"
                  mr="4"
                >
                  <Trans>Confirm</Trans>
                </Button>
              </ModalFooter>
            </form>
          )}
        </Formik>
      </ModalContent>
    </Modal>
  )

  const modalContent = phoneCodeSent ? verifyPhoneModal : setPhoneModal

  return (
    <Stack>
      <Heading as="h3" size="md">
        <Trans>Phone Number:</Trans>
      </Heading>

      <Flex align="center">
        <PhoneIcon color="gray.300" mr={2} aria-hidden="true" />
        {detailValue ? (
          <Text>{detailValue}</Text>
        ) : (
          <Trans>No current phone number</Trans>
        )}
        <Button
          variant="primary"
          ml="auto"
          onClick={onOpen}
          fontSize="sm"
          px="3"
        >
          <Trans>Edit</Trans>
        </Button>
      </Flex>
      {modalContent}
    </Stack>
  )
}

EditableUserPhoneNumber.propTypes = {
  detailValue: string,
}
