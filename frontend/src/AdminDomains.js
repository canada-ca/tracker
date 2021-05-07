import React, { useRef, useState } from 'react'
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
  Heading,
  ModalFooter,
  FormLabel,
  FormControl,
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
import { Field, Formik } from 'formik'
import FormErrorMessage from '@chakra-ui/core/dist/FormErrorMessage'
import { object as yupObject, string as yupString } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import { useUserState } from './UserState'
import { usePaginatedCollection } from './usePaginatedCollection'
import { PAGINATED_ORG_DOMAINS_ADMIN_PAGE as FORWARD } from './graphql/queries'
import { LoadingMessage } from './LoadingMessage'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { RelayPaginationControls } from './RelayPaginationControls'

export function AdminDomains({ orgSlug, domainsPerPage, orgId }) {
  const [domainSearch, setDomainSearch] = useState('')
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
    variables: { orgSlug },
    relayRoot: 'findOrganizationBySlug.domains',
  })

  const [createDomain] = useMutation(CREATE_DOMAIN, {
    refetchQueries: ['AdminPanel'],
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
          description: t`${createDomain.domain.domain} was added to ${orgSlug}`,
          status: 'info',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        setDomainSearch('')
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
      refetchQueries: ['AdminPanel'],
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
            status: 'info',
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
    refetchQueries: ['AdminPanel'],
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
          status: 'info',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        updateOnClose()
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
  })

  if (loading)
    return (
      <LoadingMessage>
        <Trans>Domain List</Trans>
      </LoadingMessage>
    )
  if (error) return <ErrorFallbackMessage error={error} />

  return (
    <Stack mb="6" w="100%">
      <Text fontSize="2xl" fontWeight="bold">
        <Trans>Domain List</Trans>
      </Text>
      <InputGroup width="100%" mb="8px">
        <InputLeftElement>
          <Icon name="add" color="gray.300" />
        </InputLeftElement>
        <Input
          type="text"
          placeholder={t`Add a domain`}
          onChange={(e) => {
            setDomainSearch(e.target.value)
          }}
        />
      </InputGroup>
      <TrackerButton
        width="100%"
        onClick={() => {
          if (!domainSearch) {
            toast({
              title: t`An error occurred.`,
              description: t`New domain name cannot be empty`,
              status: 'error',
              duration: 9000,
              isClosable: true,
              position: 'top-left',
            })
          } else {
            createDomain({
              variables: {
                orgId: orgId,
                domain: domainSearch,
                selectors: [],
              },
            })
          }
        }}
        variant="primary"
      >
        <Icon name="add" />
        <Trans>Add Domain</Trans>
      </TrackerButton>

      <Stack flexWrap="wrap" spacing={4} shouldWrapChildren>
        <ListOf
          elements={nodes}
          ifEmpty={() => (
            <Text fontSize="2xl" fontWeight="bold" textAlign="center">
              <Trans>No Domains</Trans>
            </Text>
          )}
        >
          {({ id: domainId, domain, lastRan }, index) => (
            <Stack key={'admindomain' + index} isInline align="center">
              <TrackerButton
                onClick={() => {
                  setSelectedRemoveDomainUrl(domain)
                  setSelectedRemoveDomainId(domainId)
                  removeOnOpen()
                }}
                variant="danger"
                px="2"
                fontSize="xs"
              >
                <Icon name="minus" />
              </TrackerButton>
              <TrackerButton
                variant="primary"
                px="2"
                fontSize="xs"
                onClick={() => {
                  setEditingDomainUrl(domain)
                  setEditingDomainId(domainId)
                  updateOnOpen()
                }}
              >
                <Icon name="edit" />
              </TrackerButton>
              <Domain url={domain} lastRan={lastRan} />
            </Stack>
          )}
        </ListOf>
      </Stack>

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
                  newDomainUrl: '',
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
                      selectors: [],
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
                                placeholder={t`New Domain Url`}
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
