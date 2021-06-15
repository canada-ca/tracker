import React, { useCallback, useRef, useState } from 'react'
import { Trans, t } from '@lingui/macro'
import { i18n } from '@lingui/core'
import {
  Stack,
  Text,
  InputGroup,
  InputLeftElement,
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
  ModalFooter,
  FormLabel,
  FormControl,
  Divider,
  Box,
  Grid,
} from '@chakra-ui/core'
import { Domain } from './Domain'
import { string, number } from 'prop-types'
import { ListOf } from './ListOf'
import { TrackerButton } from './TrackerButton'
import { useMutation } from '@apollo/client'
import {
  CREATE_DOMAIN,
  REMOVE_DOMAIN,
  UPDATE_DOMAIN,
} from './graphql/mutations'
import { Field, Formik, useFormik, FieldArray } from 'formik'
import FormErrorMessage from '@chakra-ui/core/dist/FormErrorMessage'
import {
  object as yupObject,
  string as yupString,
  array as yupArray,
} from 'yup'
import { fieldRequirements } from './fieldRequirements'
import { useUserState } from './UserState'
import { usePaginatedCollection } from './usePaginatedCollection'
import { PAGINATED_ORG_DOMAINS_ADMIN_PAGE as FORWARD } from './graphql/queries'
import { LoadingMessage } from './LoadingMessage'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { RelayPaginationControls } from './RelayPaginationControls'
import { useDebouncedFunction } from './useDebouncedFunction'

export function AdminDomains({ orgSlug, domainsPerPage, orgId }) {
  const [editingDomainUrl, setEditingDomainUrl] = useState()
  const [editingDomainId, setEditingDomainId] = useState()
  const toast = useToast()
  const {
    isOpen: updateIsOpen,
    onOpen: updateOnOpen,
    onClose: updateOnClose,
  } = useDisclosure()
  const {
    isOpen: removeIsOpen,
    onOpen: removeOnOpen,
    onClose: removeOnClose,
  } = useDisclosure()
  const [selectedRemoveDomainUrl, setSelectedRemoveDomainUrl] = useState()
  const [selectedRemoveDomainId, setSelectedRemoveDomainId] = useState()
  const initialFocusRef = useRef()
  const { currentUser } = useUserState()
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectorInputList, setSelectorInputList] = useState([])

  const domainForm = useFormik({
    initialValues: {
      domain: '',
    },
    validationSchema: yupObject().shape({
      domain: yupString().required(
        i18n._(fieldRequirements.domainUrl.required.message),
      ),
    }),
    onSubmit: async (values) => {
      createDomain({
        variables: {
          orgId: orgId,
          domain: values.domain,
          selectors: [],
        },
      })
    },
  })

  const {
    loading,
    isLoadingMore,
    error,
    nodes,
    next,
    previous,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    fetchHeaders: { authorization: currentUser.jwt },
    recordsPerPage: domainsPerPage,
    variables: { orgSlug, search: debouncedSearchTerm },
    relayRoot: 'findOrganizationBySlug.domains',
  })

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(domainForm.values.domain)
  }, [domainForm.values.domain])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const [createDomain] = useMutation(CREATE_DOMAIN, {
    refetchQueries: ['PaginatedOrgDomains'],
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
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
        domainForm.setFieldValue('domain', '')
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

  const [removeDomain, { loading: removeDomainLoading }] = useMutation(
    REMOVE_DOMAIN,
    {
      context: {
        headers: {
          authorization: currentUser.jwt,
        },
      },
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
      onCompleted({ removeDomain }) {
        if (removeDomain.result.__typename === 'DomainResult') {
          removeOnClose()
          toast({
            title: t`Domain removed`,
            description: t`Domain removed from ${orgSlug}`,
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else if (removeDomain.result.__typename === 'DomainError') {
          toast({
            title: t`Unable to remove domain.`,
            description: removeDomain.result.description,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else {
          toast({
            title: t`Incorrect send method received.`,
            description: t`Incorrect removeDomain.result typename.`,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          console.log('Incorrect removeDomain.result typename.')
        }
      },
    },
  )

  const [updateDomain] = useMutation(UPDATE_DOMAIN, {
    refetchQueries: ['PaginatedOrgDomains'],
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
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
        updateOnClose()
        setSelectorInputList([])
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

  const updatedDomainValidationSchema = yupObject().shape({
    newDomainUrl: yupString().required(
      i18n._(fieldRequirements.domainUrl.required.message),
    ),
    selectors: yupArray().of(
      yupString()
        .required(i18n._(fieldRequirements.selector.required.message))
        .matches(
          fieldRequirements.selector.matches.regex,
          i18n._(fieldRequirements.selector.matches.message),
        ),
    ),
  })

  if (error) return <ErrorFallbackMessage error={error} />

  const adminDomainList = loading ? (
    <LoadingMessage>
      <Trans>Domain List</Trans>
    </LoadingMessage>
  ) : (
    <Stack spacing={10} shouldWrapChildren width="100%" direction="row">
      <ListOf
        elements={nodes}
        ifEmpty={() => (
          <Text fontSize="lg" fontWeight="bold">
            <Trans>No Domains</Trans>
          </Text>
        )}
      >
        {({ id: domainId, domain, lastRan, selectors }, index) => (
          <Box key={'admindomain' + index}>
            <Stack isInline align="center">
              <Stack>
                <TrackerButton
                  variant="primary"
                  px="2"
                  onClick={() => {
                    setEditingDomainUrl(domain)
                    setEditingDomainId(domainId)
                    setSelectorInputList(selectors)
                    updateOnOpen()
                  }}
                >
                  <Icon name="edit" />
                </TrackerButton>
                <TrackerButton
                  onClick={() => {
                    setSelectedRemoveDomainUrl(domain)
                    setSelectedRemoveDomainId(domainId)
                    removeOnOpen()
                  }}
                  variant="danger"
                  px="2"
                >
                  <Icon name="minus" />
                </TrackerButton>
              </Stack>
              <Domain url={domain} lastRan={lastRan} />
            </Stack>
            <Divider borderColor="gray.900" />
          </Box>
        )}
      </ListOf>
    </Stack>
  )

  return (
    <Stack mb="6" w="100%">
      <form
        onSubmit={(e) => {
          // Manually handle submit
          // if error exist, show toast. Only submit if no errors
          e.preventDefault()
          if (domainForm.errors.domain) {
            toast({
              title: t`An error occurred.`,
              description: domainForm.errors.domain,
              status: 'error',
              duration: 9000,
              isClosable: true,
              position: 'top-left',
            })
          } else domainForm.handleSubmit()
        }}
      >
        <Stack flexDirection={['column', 'row']} align="center" isInline>
          <InputGroup width={['100%', '75%']} mb={['8px', '0']} mr={['0', '4']}>
            <InputLeftElement>
              <Icon name="plus-square" color="gray.300" />
            </InputLeftElement>
            <Input
              type="text"
              placeholder={t`Domain URL`}
              {...domainForm.getFieldProps('domain')}
            />
          </InputGroup>
          <TrackerButton
            type="submit"
            width={['100%', '25%']}
            variant="primary"
          >
            <Icon name="add" />
            <Trans>Add Domain</Trans>
          </TrackerButton>
        </Stack>
      </form>

      {adminDomainList}

      <RelayPaginationControls
        onlyPagination={true}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
      />

      <SlideIn in={updateIsOpen}>
        {(styles) => (
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
                  newDomainUrl: editingDomainUrl,
                  selectors: selectorInputList,
                }}
                initialTouched={{
                  displayName: true,
                }}
                validationSchema={updatedDomainValidationSchema}
                onSubmit={async (values) => {
                  // Submit update detail mutation
                  await updateDomain({
                    variables: {
                      domainId: editingDomainId,
                      orgId: orgId,
                      domain: values.newDomainUrl,
                      selectors: values.selectors,
                    },
                  })
                }}
              >
                {({ handleSubmit, isSubmitting, values, errors }) => (
                  <form id="form" onSubmit={handleSubmit}>
                    <ModalHeader>
                      <Trans>Edit Domain Details</Trans>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      <Stack spacing={4} p={25}>
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
                                <Trans>Domain URL:</Trans>
                              </FormLabel>

                              <Input
                                mb="2"
                                {...field}
                                id="newDomainUrl"
                                placeholder={t`Domain URL`}
                                ref={initialFocusRef}
                              />
                              <FormErrorMessage>
                                {form.errors.newDomainUrl}
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
                                    <TrackerButton
                                      type="button"
                                      variant="danger"
                                      p="3"
                                      onClick={() => arrayHelpers.remove(index)}
                                    >
                                      <Icon name="minus" size="icons.xs" />
                                    </TrackerButton>
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
                                      {errors.selectors &&
                                        errors.selectors[index] && (
                                          <>
                                            <Icon name="warning" mr="0.5em" />
                                            <Text>
                                              {errors.selectors[index]}
                                            </Text>
                                          </>
                                        )}
                                    </Stack>
                                  </React.Fragment>
                                ))}
                              </Grid>
                              <TrackerButton
                                type="button"
                                variant="primary"
                                px="2"
                                onClick={() => arrayHelpers.push('')}
                              >
                                <Icon name="small-add" size="icons.md" />
                              </TrackerButton>
                            </Box>
                          )}
                        />
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
                    </ModalFooter>
                  </form>
                )}
              </Formik>
            </ModalContent>
          </Modal>
        )}
      </SlideIn>
      <SlideIn in={removeIsOpen}>
        {(styles) => (
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
                  <Text fontWeight="bold">{selectedRemoveDomainUrl}</Text>
                </Stack>
              </ModalBody>

              <ModalFooter>
                <TrackerButton
                  variant="primary"
                  isLoading={removeDomainLoading}
                  mr={4}
                  onClick={() =>
                    removeDomain({
                      variables: {
                        domainId: selectedRemoveDomainId,
                        orgId: orgId,
                      },
                    })
                  }
                >
                  <Trans>Confirm</Trans>
                </TrackerButton>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </SlideIn>
    </Stack>
  )
}

AdminDomains.propTypes = {
  orgSlug: string.isRequired,
  orgId: string.isRequired,
  domainsPerPage: number,
}
