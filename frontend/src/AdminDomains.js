import React, { useEffect, useRef, useState } from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
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
  Button,
} from '@chakra-ui/core'
import { PaginationButtons } from './PaginationButtons'
import { Domain } from './Domain'
import { string, object, func } from 'prop-types'
import { ListOf } from './ListOf'
import { TrackerButton } from './TrackerButton'
import { useMutation } from '@apollo/client'
import {
  CREATE_DOMAIN,
  REMOVE_DOMAIN,
  UPDATE_DOMAIN,
} from './graphql/mutations'
import { slugify } from './slugify'
import { Field, Formik } from 'formik'
import FormErrorMessage from '@chakra-ui/core/dist/FormErrorMessage'
import { object as yupObject, string as yupString } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import { useUserState } from './UserState'

export function AdminDomains({ domainsData, orgName }) {
  let domains = []
  if (domainsData && domainsData.edges) {
    domains = domainsData.edges.map((e) => e.node)
  }

  const [domainList, setDomainList] = useState(domains)
  const [currentPage, setCurrentPage] = useState(1)
  const [domainsPerPage] = useState(4)
  const [domainSearch, setDomainSearch] = useState('')
  const [editingDomainUrl, setEditingDomainUrl] = useState()
  const toast = useToast()
  const { i18n } = useLingui()
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
  const [selectedRemoveDomain, setSelectedRemoveDomain] = useState()
  const initialFocusRef = useRef()
  const { currentUser } = useUserState()

  // Get current domains
  const indexOfLastDomain = currentPage * domainsPerPage
  const indexOfFirstDomain = indexOfLastDomain - domainsPerPage
  const currentDomains = domainList.slice(indexOfFirstDomain, indexOfLastDomain)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Update domains list if domainsData changes (domain added, removed, updated)
  useEffect(() => {
    setDomainList(domains)
  }, [domainsData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Set current page to last page when current page > total number of pages
  // (avoids "Page 17 of 16" for example)
  useEffect(() => {
    const totalDomainPages = Math.ceil(domainList.length / domainsPerPage)
    if (currentPage > totalDomainPages) {
      paginate(totalDomainPages)
    }
  }, [domainList]) // eslint-disable-line react-hooks/exhaustive-deps

  const [createDomain] = useMutation(CREATE_DOMAIN, {
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
        position: 'top-left',
      })
    },
    onCompleted() {
      toast({
        title: i18n._(t`Domain added`),
        description: i18n._(t`Domain was added to ${orgName}`),
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
      setDomainSearch('')
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
      refetchQueries: ['Domains'],
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
      onCompleted() {
        removeOnClose()
        toast({
          title: i18n._(t`Domain removed`),
          description: i18n._(t`Domain removed from ${orgName}`),
          status: 'info',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
    },
  )

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
        position: 'top-left',
      })
    },
    onCompleted() {
      toast({
        title: i18n._(t`Domain updated`),
        description: i18n._(t`Domain from ${orgName} successfully updated`),
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
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
    <Stack mb="6" w="100%">
      <Text fontSize="2xl" fontWeight="bold">
        <Trans>Domain List</Trans>
      </Text>
      <InputGroup width="100%" mb="8px">
        <InputLeftElement>
          <Icon name="search" color="gray.300" />
        </InputLeftElement>
        <Input
          type="text"
          placeholder={i18n._(t`Search for a domain`)}
          value={domainSearch}
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
              title: i18n._(t`An error occurred.`),
              description: i18n._(t`New domain name cannot be empty`),
              status: 'error',
              duration: 9000,
              isClosable: true,
              position: 'top-left',
            })
          } else {
            createDomain({
              variables: {
                orgSlug: slugify(orgName),
                url: domainSearch,
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

      <Stack spacing={10} shouldWrapChildren width="100%">
        <Stack direction="row" spacing={4}>
          <Stack spacing={4} flexWrap="wrap">
            <ListOf
              elements={currentDomains}
              ifEmpty={() => (
                <Text fontSize="lg" fontWeight="bold">
                  <Trans>No Domains</Trans>
                </Text>
              )}
            >
              {({ url, lastRan }, index) => (
                <Stack key={'admindomain' + index} isInline align="center">
                  <TrackerButton
                    onClick={() => {
                      setSelectedRemoveDomain(url)
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
                      setEditingDomainUrl(url)
                      updateOnOpen()
                    }}
                  >
                    <Icon name="edit" />
                  </TrackerButton>
                  <Domain url={url} lastRan={lastRan} />
                </Stack>
              )}
            </ListOf>
          </Stack>
        </Stack>
      </Stack>

      {domainList.length > 0 && (
        <PaginationButtons
          perPage={domainsPerPage}
          total={domainList.length}
          paginate={paginate}
          currentPage={currentPage}
        />
      )}

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
                  <Text fontWeight="bold">{selectedRemoveDomain}</Text>
                </Stack>
              </ModalBody>

              <ModalFooter>
                <TrackerButton
                  variant="primary"
                  isLoading={removeDomainLoading}
                  mr={4}
                  onClick={() =>
                    removeDomain({
                      variables: { url: selectedRemoveDomain },
                    })
                  }
                >
                  <Trans>Confirm</Trans>
                </TrackerButton>
                <Button
                  color="primary"
                  bg="transparent"
                  borderColor="primary"
                  borderWidth="1px"
                  variant="outline"
                  onClick={removeOnClose}
                >
                  <Trans>Close</Trans>
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </SlideIn>
    </Stack>
  )
}

AdminDomains.propTypes = {
  domainsData: object,
  orgName: string,
  refetchFunc: func,
}
