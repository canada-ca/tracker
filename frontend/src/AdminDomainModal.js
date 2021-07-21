import React, { useRef } from 'react'
import { t, Trans } from '@lingui/macro'
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react'
import { MinusIcon, SmallAddIcon, WarningIcon } from '@chakra-ui/icons'
import { array, bool, func, object, string } from 'prop-types'
import { Field, FieldArray, Formik } from 'formik'
import { CREATE_DOMAIN, UPDATE_DOMAIN } from './graphql/mutations'
import { useMutation } from '@apollo/client'

export function AdminDomainModal({
  isOpen,
  onClose,
  validationSchema,
  orgId,
  editingDomainId,
  editingDomainUrl,
  selectorInputList,
  orgSlug,
  mutation,
}) {
  const toast = useToast()
  const initialFocusRef = useRef()

  const [createDomain] = useMutation(CREATE_DOMAIN, {
    refetchQueries: ['PaginatedOrgDomains'],
    onError(error) {
      toast({
        title: t`An error occurred.`,
        description: error.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ createDomain }) {
      if (createDomain.result.__typename === 'Domain') {
        toast({
          title: t`Domain added`,
          description: t`${createDomain.result.domain} was added to ${orgSlug}`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        onClose()
      } else if (createDomain.result.__typename === 'DomainError') {
        toast({
          title: t`Unable to create new domain.`,
          description: createDomain.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect createDomain.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect createDomain.result typename.')
      }
    },
  })

  const [updateDomain] = useMutation(UPDATE_DOMAIN, {
    refetchQueries: ['PaginatedOrgDomains'],

    onError(error) {
      toast({
        title: t`An error occurred.`,
        description: error.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ updateDomain }) {
      if (updateDomain.result.__typename === 'Domain') {
        toast({
          title: t`Domain updated`,
          description: t`${editingDomainUrl} from ${orgSlug} successfully updated to ${updateDomain.result.domain}`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        onClose()
      } else if (updateDomain.result.__typename === 'DomainError') {
        toast({
          title: t`Unable to update domain.`,
          description: updateDomain.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect updateDomain.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect updateDomain.result typename.')
      }
    },
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      initialFocusRef={initialFocusRef}
      motionPreset="slideInBottom"
    >
      <ModalOverlay />
      <ModalContent pb={4}>
        <Formik
          validateOnBlur={false}
          initialValues={{
            domainUrl: editingDomainUrl,
            selectors: selectorInputList,
          }}
          initialTouched={{
            displayName: true,
          }}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            // Submit update detail mutation

            if (mutation === 'update') {
              await updateDomain({
                variables: {
                  domainId: editingDomainId,
                  orgId: orgId,
                  domain: values.domainUrl,
                  selectors: values.selectors,
                },
              })
            } else if (mutation === 'create') {
              await createDomain({
                variables: {
                  orgId: orgId,
                  domain: values.domainUrl,
                  selectors: values.selectors,
                },
              })
            }
          }}
        >
          {({ handleSubmit, isSubmitting, values, errors }) => (
            <form id="form" onSubmit={handleSubmit}>
              <ModalHeader>
                {mutation === 'update' ? (
                  <Trans>Edit Domain Details</Trans>
                ) : (
                  <Trans>Add Domain Details</Trans>
                )}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Stack spacing={4} p={25}>
                  <Field id="domainUrl" name="domainUrl">
                    {({ field, form }) => (
                      <FormControl
                        isInvalid={
                          form.errors.domainUrl && form.touched.domainUrl
                        }
                      >
                        <FormLabel htmlFor="domainUrl" fontWeight="bold">
                          <Trans>New Domain URL:</Trans>
                        </FormLabel>

                        <Input
                          mb="2"
                          {...field}
                          id="domainUrl"
                          placeholder={t`New Domain URL`}
                          ref={initialFocusRef}
                        />
                        <FormErrorMessage>
                          {form.errors.domainUrl}
                        </FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>

                  <FieldArray
                    name="selectors"
                    render={(arrayHelpers) => (
                      <Box>
                        <Text fontWeight="bold">
                          <Trans>DKIM Selectors:</Trans>
                        </Text>
                        <Grid
                          gridTemplateColumns="auto 1fr"
                          gap="0.5em"
                          alignItems="center"
                          mb="0.5em"
                        >
                          {values.selectors.map((_selector, index) => (
                            <React.Fragment key={index}>
                              <Button
                                variant="danger"
                                data-testid="remove-dkim-selector"
                                type="button"
                                p="3"
                                onClick={() => arrayHelpers.remove(index)}
                              >
                                <MinusIcon size="icons.xs" />
                              </Button>
                              <Field
                                id={`selectors.${index}`}
                                name={`selectors.${index}`}
                                h="1.5rem"
                              >
                                {({ field, form }) => (
                                  <FormControl
                                    isInvalid={
                                      form.errors.selectors &&
                                      form.errors.selectors[index] &&
                                      form.touched.selectors &&
                                      form.touched.selectors[index]
                                    }
                                  >
                                    <Input
                                      {...field}
                                      id={`selectors.${index}`}
                                      name={`selectors.${index}`}
                                      placeholder={t`DKIM Selector`}
                                      ref={initialFocusRef}
                                    />
                                  </FormControl>
                                )}
                              </Field>
                              <Stack
                                isInline
                                align="center"
                                gridColumn="2 / 3"
                                color="red.500"
                              >
                                {errors.selectors && errors.selectors[index] && (
                                  <>
                                    <WarningIcon mr="0.5em" />
                                    <Text>{errors.selectors[index]}</Text>
                                  </>
                                )}
                              </Stack>
                            </React.Fragment>
                          ))}
                        </Grid>
                        <Button
                          variant="primary"
                          data-testid="add-dkim-selector"
                          type="button"
                          px="2"
                          onClick={() => arrayHelpers.push('')}
                        >
                          <SmallAddIcon size="icons.md" />
                        </Button>
                      </Box>
                    )}
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
}

AdminDomainModal.propTypes = {
  isOpen: bool,
  onClose: func,
  validationSchema: object,
  orgId: string,
  editingDomainId: string,
  editingDomainUrl: string,
  selectorInputList: array,
  orgSlug: string,
  mutation: string,
}
