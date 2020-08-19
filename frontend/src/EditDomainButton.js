import React, { useRef, useState } from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  Stack,
  Text,
  Icon,
  Input,
  useToast,
  useDisclosure,
  SlideIn,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Heading,
  ModalFooter,
  FormLabel,
  FormControl,
  Button,
} from '@chakra-ui/core'
import { string } from 'prop-types'
import { TrackerButton } from './TrackerButton'
import { useMutation } from '@apollo/client'
import { UPDATE_DOMAIN } from './graphql/mutations'
import { Field, Formik } from 'formik'
import FormErrorMessage from '@chakra-ui/core/dist/FormErrorMessage'
import { object as yupObject, string as yupString } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import { useUserState } from './UserState'

export function EditDomainButton({ orgName, url }) {
  const [editingDomainUrl, setEditingDomainUrl] = useState()
  const toast = useToast()
  const { i18n } = useLingui()
  const initialFocusRef = useRef()
  const { currentUser } = useUserState()
  const {
    isOpen: updateIsOpen,
    onOpen: updateOnOpen,
    onClose: updateOnClose,
  } = useDisclosure()

  const [updateDomain] = useMutation(UPDATE_DOMAIN, {
    refetchQueries: ['Domains'],
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
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
      toast({
        title: i18n._(t`Domain updated`),
        description: i18n._(t`Domain from ${orgName} successfully updated`),
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
      updateOnClose()
    },
  })

  const updatedDomainValidationSchema = yupObject().shape({
    newDomainUrl: yupString().required(
      i18n._(fieldRequirements.domainUrl.required.message),
    ),
  })

  return (
    <>
      <TrackerButton
        variant="primary"
        px="2"
        fontSize="xs"
        onClick={() => {
          setEditingDomainUrl(url)
          updateOnOpen()
        }}
      >
        <Icon name="edit" />
      </TrackerButton>

      <SlideIn in={updateIsOpen}>
        {styles => (
          <Modal
            isOpen={true}
            onClose={updateOnClose}
            initialFocusRef={initialFocusRef}
          >
            <ModalOverlay opacity={styles.opacity} />
            <ModalContent pb={4} {...styles}>
              <Formik
                validateOnBlur={false}
                initialValues={{
                  newDomainUrl: '',
                }}
                initialTouched={{
                  displayName: true,
                }}
                validationSchema={updatedDomainValidationSchema}
                onSubmit={async values => {
                  // Submit update detail mutation
                  await updateDomain({
                    variables: {
                      currentUrl: editingDomainUrl,
                      updatedUrl: values.newDomainUrl,
                      updatedSelectors: [],
                    },
                  })
                }}
              >
                {({ handleSubmit, isSubmitting }) => (
                  <form id="form" onSubmit={handleSubmit}>
                    <ModalHeader>
                      <Trans>Edit Domain Details</Trans>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      <Stack spacing={4} p={25}>
                        <Heading as="h3" size="sm">
                          <Trans>Current Domain URL:</Trans>
                        </Heading>

                        <Text>{editingDomainUrl}</Text>

                        <Field id="newDomainUrl" name="newDomainUrl">
                          {({ field, form }) => (
                            <FormControl
                              isInvalid={
                                form.errors.newDomainUrl &&
                                form.touched.newDomainUrl
                              }
                            >
                              <FormLabel
                                htmlFor="newDomainUrl"
                                fontWeight="bold"
                              >
                                <Trans>New Domain Url:</Trans>
                              </FormLabel>

                              <Input
                                {...field}
                                id="newDomainUrl"
                                placeholder={i18n._(t`New Domain Url`)}
                                ref={initialFocusRef}
                              />
                              <FormErrorMessage>
                                {form.errors.newDomainUrl}
                              </FormErrorMessage>
                            </FormControl>
                          )}
                        </Field>
                      </Stack>
                    </ModalBody>

                    <ModalFooter>
                      <TrackerButton
                        variant="primary"
                        isLoading={isSubmitting}
                        type="submit"
                        mr="4"
                      >
                        <Trans>Confirm</Trans>
                      </TrackerButton>
                      <Button
                        color="primary"
                        bg="transparent"
                        borderColor="primary"
                        borderWidth="1px"
                        variant="outline"
                        onClick={updateOnClose}
                      >
                        <Trans>Close</Trans>
                      </Button>
                    </ModalFooter>
                  </form>
                )}
              </Formik>
            </ModalContent>
          </Modal>
        )}
      </SlideIn>
    </>
  )
}

EditDomainButton.propTypes = {
  url: string,
  orgName: string,
}
