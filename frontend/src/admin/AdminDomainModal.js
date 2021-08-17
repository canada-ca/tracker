import React, { useRef } from 'react'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  IconButton,
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
import { MinusIcon, SmallAddIcon } from '@chakra-ui/icons'
import { array, bool, func, object, string } from 'prop-types'
import { Field, FieldArray, Formik } from 'formik'
import { useMutation } from '@apollo/client'

import { CREATE_DOMAIN, UPDATE_DOMAIN } from '../graphql/mutations'

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
  const { i18n } = useLingui()

  const [createDomain] = useMutation(CREATE_DOMAIN, {
    refetchQueries: ['PaginatedOrgDomains'],
    onError(error) {
      toast({
        title: i18n._(t`An error occurred.`),
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
          title: i18n._(t`Domain added`),
          description: i18n._(
            t`${createDomain.result.domain} was added to ${orgSlug}`,
          ),
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        onClose()
      } else if (createDomain.result.__typename === 'DomainError') {
        toast({
          title: i18n._(t`Unable to create new domain.`),
          description: createDomain.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: i18n._(t`Incorrect send method received.`),
          description: i18n._(t`Incorrect createDomain.result typename.`),
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
        title: i18n._(t`An error occurred.`),
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
          title: i18n._(t`Domain updated`),
          description: i18n._(
            t`${editingDomainUrl} from ${orgSlug} successfully updated to ${updateDomain.result.domain}`,
          ),
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        onClose()
      } else if (updateDomain.result.__typename === 'DomainError') {
        toast({
          title: i18n._(t`Unable to update domain.`),
          description: updateDomain.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: i18n._(t`Incorrect send method received.`),
          description: i18n._(t`Incorrect updateDomain.result typename.`),
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
          initialValues={{
            domainUrl: editingDomainUrl,
            selectors: selectorInputList,
          }}
          initialTouched={{
            domainUrl: true,
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
          {({ handleSubmit, isSubmitting, values, errors, touched }) => (
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
                          placeholder={i18n._(t`New Domain URL`)}
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
                        {values.selectors.map((_selector, index) => (
                          <FormControl
                            key={index}
                            isInvalid={
                              errors.selectors &&
                              errors.selectors[index] &&
                              touched.selectors &&
                              touched.selectors[index]
                            }
                          >
                            <Grid
                              gridTemplateColumns="auto 1fr"
                              gap="0.5em"
                              alignItems="center"
                              mb="0.5em"
                            >
                              <IconButton
                                variant="danger"
                                icon={<MinusIcon size="icons.xs" />}
                                data-testid="remove-dkim-selector"
                                type="button"
                                p="3"
                                onClick={() => arrayHelpers.remove(index)}
                                aria-label="remove-dkim-selector"
                              />
                              <Field
                                id={`selectors.${index}`}
                                name={`selectors.${index}`}
                                h="1.5rem"
                              >
                                {({ field }) => (
                                  <Input
                                    {...field}
                                    id={`selectors.${index}`}
                                    name={`selectors.${index}`}
                                    placeholder={i18n._(t`DKIM Selector`)}
                                    ref={initialFocusRef}
                                  />
                                )}
                              </Field>

                              <FormErrorMessage gridColumn="2 / 3" mt={0}>
                                {errors &&
                                  errors.selectors &&
                                  errors.selectors[index]}
                              </FormErrorMessage>
                            </Grid>
                          </FormControl>
                        ))}
                        <IconButton
                          variant="primary"
                          icon={<SmallAddIcon size="icons.md" />}
                          data-testid="add-dkim-selector"
                          type="button"
                          px="2"
                          onClick={() => arrayHelpers.push('')}
                          aria-label="add-dkim-selector"
                        />
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
