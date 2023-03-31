import React, { useRef } from 'react'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
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
  SimpleGrid,
  Stack,
  Switch,
  Tag,
  TagCloseButton,
  TagLabel,
  TagRightIcon,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react'
import {
  AddIcon,
  MinusIcon,
  QuestionOutlineIcon,
  SmallAddIcon,
} from '@chakra-ui/icons'
import { array, bool, func, number, object, string } from 'prop-types'
import { Field, FieldArray, Formik } from 'formik'
import { useMutation } from '@apollo/client'

import { DomainField } from '../components/fields/DomainField'
import { CREATE_DOMAIN, UPDATE_DOMAIN } from '../graphql/mutations'

export function AdminDomainModal({
  isOpen,
  onClose,
  validationSchema,
  orgId,
  ...props
}) {
  const {
    editingDomainId,
    editingDomainUrl,
    selectorInputList,
    tagInputList,
    orgSlug,
    archived,
    hidden,
    permission,
    mutation,
    orgCount,
  } = props
  const toast = useToast()
  const initialFocusRef = useRef()
  const { i18n } = useLingui()

  const [createDomain] = useMutation(CREATE_DOMAIN, {
    refetchQueries: ['PaginatedOrgDomains', 'FindAuditLogs'],
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
    refetchQueries: ['PaginatedOrgDomains', 'FindAuditLogs'],

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

  const tagOptions = [
    { en: 'NEW', fr: 'NOUVEAU' },
    { en: 'PROD', fr: 'PROD' },
    { en: 'STAGING', fr: 'DEV' },
    { en: 'TEST', fr: 'TEST' },
    { en: 'WEB', fr: 'WEB' },
    { en: 'INACTIVE', fr: 'INACTIF' },
  ]

  const addableTags = (values, helper) => {
    const stringValues = values?.map((label) => {
      return label[i18n.locale]
    })
    const difference = tagOptions.filter(
      (label) => !stringValues?.includes(label[i18n.locale]),
    )
    return difference?.map((label, idx) => {
      return (
        <Tag
          key={idx}
          id={`add-tag-${label[i18n.locale]}`}
          as="button"
          _hover={{ bg: 'gray.200' }}
          borderRadius="full"
          onClick={(e) => {
            e.preventDefault()
            helper.push(label)
          }}
        >
          <TagLabel>{label[i18n.locale]}</TagLabel>
          <TagRightIcon as={AddIcon} color="gray.500" ml="auto" />
        </Tag>
      )
    })
  }

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
            // convert initial tags to input type
            tags: tagInputList?.map((label) => {
              return tagOptions.filter((option) => {
                return option[i18n.locale] == label
              })[0]
            }),
            archiveDomain: archived,
            hideDomain: hidden,
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
                  tags: values.tags,
                  archived: values.archiveDomain,
                  hidden: values.hideDomain,
                },
              })
            } else if (mutation === 'create') {
              await createDomain({
                variables: {
                  orgId: orgId,
                  domain: values.domainUrl,
                  selectors: values.selectors,
                  tags: values.tags,
                  archived: values.archiveDomain,
                  hidden: values.hideDomain,
                },
              })
            }
          }}
        >
          {({
            handleSubmit,
            handleChange,
            isSubmitting,
            values,
            errors,
            touched,
          }) => (
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
                  <DomainField
                    name="domainUrl"
                    label={t`New Domain URL:`}
                    placeholder={t`New Domain URL`}
                  />

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
                  <FieldArray
                    name="tags"
                    render={(arrayHelpers) => (
                      <Box>
                        <Text fontWeight="bold">Tags:</Text>
                        <SimpleGrid columns={3} spacing={2}>
                          {values.tags?.map((label, idx) => {
                            return (
                              <Tag key={idx} borderRadius="full">
                                <TagLabel>{label[i18n.locale]}</TagLabel>
                                <TagCloseButton
                                  ml="auto"
                                  onClick={() => arrayHelpers.remove(idx)}
                                  aria-label={`remove-tag-${
                                    label[i18n.locale]
                                  }`}
                                />
                              </Tag>
                            )
                          })}
                        </SimpleGrid>
                        <Divider borderBottomColor="gray.900" />
                        <SimpleGrid columns={3} spacing={2}>
                          {addableTags(values.tags, arrayHelpers)}
                        </SimpleGrid>
                      </Box>
                    )}
                  />

                  <Flex align="center">
                    <Tooltip
                      label={t`Prevent this domain from being counted in your organization's summaries.`}
                    >
                      <QuestionOutlineIcon tabIndex={0} />
                    </Tooltip>
                    <label>
                      <Switch
                        isFocusable={true}
                        name="hideDomain"
                        mx="2"
                        defaultChecked={values.hideDomain}
                        onChange={handleChange}
                      />
                    </label>
                    <Badge variant="outline" color="gray.900" p="1.5">
                      <Trans>Hide domain</Trans>
                    </Badge>
                  </Flex>

                  {permission === 'SUPER_ADMIN' && (
                    <Box>
                      <Flex align="center">
                        <Tooltip
                          label={t`Prevent this domain from being visible, scanned, and being counted in any summaries.`}
                        >
                          <QuestionOutlineIcon tabIndex={0} />
                        </Tooltip>
                        <label>
                          <Switch
                            colorScheme="red"
                            isFocusable={true}
                            name="archiveDomain"
                            mx="2"
                            defaultChecked={values.archiveDomain}
                            onChange={handleChange}
                          />
                        </label>
                        <Badge variant="outline" color="gray.900" p="1.5">
                          <Trans>Archive domain</Trans>
                        </Badge>
                      </Flex>

                      <Text fontSize="sm">
                        {orgCount > 0 ? (
                          <Trans>
                            Note: This will affect results for {orgCount}{' '}
                            organizations
                          </Trans>
                        ) : (
                          <Trans>
                            Note: This could affect results for multiple
                            organizations
                          </Trans>
                        )}
                      </Text>
                    </Box>
                  )}

                  <Text>
                    <Trans>
                      Please allow up to 24 hours for summaries to reflect any
                      changes.
                    </Trans>
                  </Text>
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
  tagInputList: array,
  archived: bool,
  hidden: bool,
  permission: string,
  orgSlug: string,
  mutation: string,
  orgCount: number,
}
