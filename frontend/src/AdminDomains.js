import React, { useEffect, useRef, useState } from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  Text,
  Stack,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  Icon,
  Input,
  Button,
  Divider,
  IconButton,
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
import { PaginationButtons } from './PaginationButtons'
import { Domain } from './Domain'
import { string, object, func } from 'prop-types'
import { ListOf } from './ListOf'
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
  const { isOpen, onOpen, onClose } = useDisclosure()
  const initialFocusRef = useRef()

  // Get current domains
  const indexOfLastDomain = currentPage * domainsPerPage
  const indexOfFirstDomain = indexOfLastDomain - domainsPerPage
  const currentDomains = domainList.slice(indexOfFirstDomain, indexOfLastDomain)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Update domains list if domainsData changes (domain added, removed, updated)
  useEffect(() => {
    setDomainList(domains)
  }, [domainsData])

  // Set current page to last page when current page > total number of pages
  // (avoids "Page 17 of 16" for example)
  useEffect(() => {
    const totalDomainPages = Math.ceil(domainList.length / domainsPerPage)
    if (currentPage > totalDomainPages) {
      paginate(totalDomainPages)
    }
  }, [domainList])

  const [createDomain] = useMutation(CREATE_DOMAIN, {
    refetchQueries: ['Domains'],
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
        title: i18n._(t`Domain added`),
        description: i18n._(t`Domain was added to ${orgName}`),
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
      setDomainSearch('')
    },
  })

  const [removeDomain] = useMutation(REMOVE_DOMAIN, {
    refetchQueries: ['Domains'],
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
        title: i18n._(t`Domain removed`),
        description: i18n._(t`Domain removed from ${orgName}`),
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
    },
  })

  const [updateDomain] = useMutation(UPDATE_DOMAIN, {
    refetchQueries: ['Domains'],
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
      onClose()
    },
  })

  const updatedDomainValidationSchema = yupObject().shape({
    newDomainUrl: yupString().required(
      i18n._(fieldRequirements.domainUrl.required.message),
    ),
  })

  return (
    <Stack mb={6} w="100%">
      <Text fontSize="2xl" fontWeight="bold">
        <Trans>Domain List</Trans>
      </Text>

      <SimpleGrid mb={6} columns={{ md: 1, lg: 2 }} spacing="15px">
        <InputGroup>
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
        <Button
          width={'100%'}
          leftIcon="add"
          variantColor="blue"
          onClick={() => {
            if (!domainSearch) {
              toast({
                title: i18n._(t`An error occurred.`),
                description: i18n._(t`New domain name cannot be empty`),
                status: 'error',
                duration: 9000,
                isClosable: true,
                position: 'bottom-left',
              })
            } else {
              createDomain({
                variables: { orgSlug: slugify(orgName), url: domainSearch },
              })
            }
          }}
        >
          <Trans>Add Domain</Trans>
        </Button>
      </SimpleGrid>
      <Divider />

      <Stack spacing={10} shouldWrapChildren>
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
                  <IconButton
                    size="xs"
                    variantColor="red"
                    icon="minus"
                    onClick={() => {
                      removeDomain({ variables: { url: url } })
                    }}
                  />
                  <IconButton
                    size="xs"
                    icon="edit"
                    variantColor="blue"
                    onClick={() => {
                      setEditingDomainUrl(url)
                      onOpen()
                    }}
                  />
                  <Domain url={url} lastRan={lastRan} />
                </Stack>
              )}
            </ListOf>
          </Stack>
        </Stack>
      </Stack>

      <Divider />
      {domainList.length > 0 && (
        <PaginationButtons
          perPage={domainsPerPage}
          total={domainList.length}
          paginate={paginate}
          currentPage={currentPage}
        />
      )}

      <SlideIn in={isOpen}>
        {(styles) => (
          <Modal
            isOpen={true}
            onClose={onClose}
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
                      <Button
                        variantColor="teal"
                        isLoading={isSubmitting}
                        type="submit"
                        mr={4}
                      >
                        <Trans>Confirm</Trans>
                      </Button>
                      <Button
                        variantColor="teal"
                        variant="outline"
                        onClick={onClose}
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
    </Stack>
  )
}

AdminDomains.propTypes = {
  domainsData: object,
  orgName: string,
  refetchFunc: func,
}
