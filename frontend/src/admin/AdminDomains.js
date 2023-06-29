import React, { useCallback, useEffect, useState } from 'react'
import { t, Trans } from '@lingui/macro'
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { AddIcon, EditIcon, MinusIcon, PlusSquareIcon } from '@chakra-ui/icons'
import { useMutation } from '@apollo/client'
import { useLingui } from '@lingui/react'
import { number, string } from 'prop-types'

import { AdminDomainModal } from './AdminDomainModal'
import { AdminDomainCard } from './AdminDomainCard'

import { ListOf } from '../components/ListOf'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { createValidationSchema, getRequirement, schemaToValidation } from '../utilities/fieldRequirements'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { PAGINATED_ORG_DOMAINS_ADMIN_PAGE as FORWARD } from '../graphql/queries'
import { REMOVE_DOMAIN } from '../graphql/mutations'
import { Formik } from 'formik'

export function AdminDomains({ orgSlug, orgId, permission }) {
  const toast = useToast()
  const { i18n } = useLingui()

  const [newDomainUrl, setNewDomainUrl] = useState('')
  const [domainsPerPage, setDomainsPerPage] = useState(20)
  const [selectedRemoveProps, setSelectedRemoveProps] = useState({
    domain: '',
    domainId: '',
    rcode: '',
  })
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [modalProps, setModalProps] = useState({
    hidden: false,
    archived: false,
    mutation: '',
    tagInputList: [],
    selectorInputList: [],
    editingDomainId: '',
    editingDomainUrl: '',
  })
  const [filters, setFilters] = useState([])

  const { isOpen: updateIsOpen, onOpen: updateOnOpen, onClose: updateOnClose } = useDisclosure()
  const { isOpen: removeIsOpen, onOpen: removeOnOpen, onClose: removeOnClose } = useDisclosure()

  const validationSchema = schemaToValidation({
    filterCategory: getRequirement('field'),
    comparison: getRequirement('field'),
    filterValue: getRequirement('field'),
  })

  const fetchVariables = {
    orgSlug,
    search: debouncedSearchTerm,
    orderBy: { field: 'DOMAIN', direction: 'ASC' },
    filters,
  }

  const { loading, isLoadingMore, error, nodes, next, previous, resetToFirstPage, hasNextPage, hasPreviousPage } =
    usePaginatedCollection({
      fetchForward: FORWARD,
      recordsPerPage: domainsPerPage,
      variables: fetchVariables,
      relayRoot: 'findOrganizationBySlug.domains',
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    })

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(newDomainUrl)
  }, [newDomainUrl])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  useEffect(() => {
    resetToFirstPage()
  }, [orgSlug])

  const [removeDomain] = useMutation(REMOVE_DOMAIN, {
    refetchQueries: ['FindAuditLogs'],
    update(cache, { data: { removeDomain } }) {
      if (removeDomain.result.__typename === 'DomainResult') {
        cache.evict({ id: cache.identify(removeDomain.result.domain) })
      }
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
    onCompleted({ removeDomain }) {
      if (removeDomain.result.__typename === 'DomainResult') {
        removeOnClose()
        toast({
          title: i18n._(t`Domain removed`),
          description: i18n._(t`Domain removed from ${orgSlug}`),
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else if (removeDomain.result.__typename === 'DomainError') {
        toast({
          title: i18n._(t`Unable to remove domain.`),
          description: removeDomain.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: i18n._(t`Incorrect send method received.`),
          description: i18n._(t`Incorrect removeDomain.result typename.`),
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect removeDomain.result typename.')
      }
    },
  })

  if (error) return <ErrorFallbackMessage error={error} />

  const filterTagOptions = [
    { value: t`NEW`, text: t`New` },
    { value: t`PROD`, text: t`Prod` },
    { value: t`STAGING`, text: t`Staging` },
    { value: t`TEST`, text: t`Test` },
    { value: t`WEB`, text: t`Web` },
    { value: t`INACTIVE`, text: t`Inactive` },
    { value: t`OUTSIDE`, text: t`Outside` },
    { value: `NXDOMAIN`, text: `NXDOMAIN` },
    { value: `BLOCKED`, text: t`Blocked` },
    { value: `SCAN_PENDING`, text: t`Scan Pending` },
    { value: `HIDDEN`, text: t`Hidden` },
    { value: `ARCHIVED`, text: t`Archived` },
  ]

  const adminDomainList = loading ? (
    <LoadingMessage minH="50px">
      <Trans>Domain List</Trans>
    </LoadingMessage>
  ) : (
    <>
      <Formik
        validationSchema={validationSchema}
        initialValues={{
          filterCategory: 'TAGS',
          comparison: '',
          filterValue: '',
        }}
        onSubmit={(values, { resetForm }) => {
          setFilters([
            ...new Map(
              [...filters, values].map((item) => {
                return [item['filterValue'], item]
              }),
            ).values(),
          ])
          resetForm()
        }}
      >
        {({ handleChange, handleSubmit, errors }) => {
          return (
            <form onSubmit={handleSubmit} role="form" aria-label="form" name="form">
              <Flex align="center">
                <Text fontWeight="bold" mr="2">
                  <Trans>Filters:</Trans>
                </Text>

                <Box maxW="25%" mx="1">
                  <Select name="comparison" borderColor="black" onChange={handleChange}>
                    <option hidden value="">
                      <Trans>Comparison</Trans>
                    </option>
                    <option value="EQUAL">
                      <Trans>EQUALS</Trans>
                    </option>
                    <option value="NOT_EQUAL">
                      <Trans>DOES NOT EQUAL</Trans>
                    </option>
                  </Select>
                  <Text color="red.500" mt={0}>
                    {errors.comparison}
                  </Text>
                </Box>
                <Box maxW="25%" mx="1">
                  <Select name="filterValue" borderColor="black" onChange={handleChange}>
                    <option hidden value="">
                      <Trans>Status/Tag</Trans>
                    </option>
                    {filterTagOptions.map(({ value, text }, idx) => {
                      return (
                        <option key={idx} value={value}>
                          {text}
                        </option>
                      )
                    })}
                  </Select>
                  <Text color="red.500" mt={0}>
                    {errors.filterValue}
                  </Text>
                </Box>
                <Button ml="auto" variant="primary" type="submit">
                  <Trans>Apply</Trans>
                </Button>
              </Flex>
            </form>
          )
        }}
      </Formik>
      <ListOf
        elements={nodes}
        ifEmpty={() => (
          <Text layerStyle="loadingMessage">
            <Trans>No Domains</Trans>
          </Text>
        )}
      >
        {({ id: domainId, domain, selectors, claimTags, hidden, archived, rcode, organizations }, index) => (
          <>
            {index === 0 && <Divider borderBottomColor="gray.400" />}
            <Flex p="1" key={'admindomain' + index} align="center" rounded="md" mb="1">
              <Stack direction="row" flexGrow="0" mr="2">
                <IconButton
                  data-testid={`remove-${index}`}
                  onClick={() => {
                    setSelectedRemoveProps({ domain, domainId, rcode })
                    removeOnOpen()
                  }}
                  variant="danger"
                  px="2"
                  icon={<MinusIcon />}
                  aria-label={'Remove ' + domain}
                />
                <IconButton
                  data-testid={`edit-${index}`}
                  variant="primary"
                  px="2"
                  onClick={() => {
                    setModalProps({
                      hidden,
                      archived,
                      mutation: 'update',
                      tagInputList: claimTags,
                      selectorInputList: selectors,
                      editingDomainId: domainId,
                      editingDomainUrl: domain,
                      orgCount: organizations.totalCount,
                    })
                    updateOnOpen()
                  }}
                  icon={<EditIcon />}
                  aria-label={'Edit ' + domain}
                />
              </Stack>
              <AdminDomainCard
                url={domain}
                tags={claimTags}
                isHidden={hidden}
                isArchived={archived}
                rcode={rcode}
                locale={i18n.locale}
                flexGrow={1}
                fontSize={{ base: '75%', sm: '100%' }}
              />
            </Flex>
            <Divider borderBottomColor="gray.400" />
          </>
        )}
      </ListOf>
    </>
  )

  return (
    <Stack mb="6" w="100%">
      <Box bg="gray.100" p="2" mb="2" borderColor="gray.300" borderWidth="1px">
        <form
          id="form"
          onSubmit={async (e) => {
            e.preventDefault() // prevents page from refreshing
            setModalProps({
              hidden: false,
              archived: false,
              mutation: 'create',
              tagInputList: [],
              selectorInputList: [],
              editingDomainId: '',
              editingDomainUrl: newDomainUrl,
              orgCount: 0,
            })
            updateOnOpen()
          }}
        >
          <Flex flexDirection={{ base: 'column', md: 'row' }} align="center">
            <Text
              as="label"
              htmlFor="Search-for-domain-field"
              fontSize="md"
              fontWeight="bold"
              textAlign="center"
              mr={2}
            >
              <Trans>Search: </Trans>
            </Text>
            <InputGroup width={{ base: '100%', md: '75%' }} mb={{ base: '8px', md: '0' }} mr={{ base: '0', md: '4' }}>
              <InputLeftElement aria-hidden="true">
                <PlusSquareIcon color="gray.300" />
              </InputLeftElement>
              <Input
                id="Search-for-domain-field"
                type="text"
                placeholder={i18n._(t`Domain URL`)}
                aria-label={i18n._(t`Search by Domain URL`)}
                onChange={(e) => {
                  setNewDomainUrl(e.target.value)
                  resetToFirstPage()
                }}
              />
            </InputGroup>
            <Button id="addDomainBtn" width={{ base: '100%', md: '25%' }} variant="primary" type="submit">
              <AddIcon mr={2} aria-hidden="true" />
              <Trans>Add Domain</Trans>
            </Button>
          </Flex>
        </form>
        <Divider borderBottomWidth="1px" borderBottomColor="black" />
        <RelayPaginationControls
          onlyPagination={false}
          selectedDisplayLimit={domainsPerPage}
          setSelectedDisplayLimit={setDomainsPerPage}
          displayLimitOptions={[5, 10, 20, 50, 100]}
          resetToFirstPage={resetToFirstPage}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          next={next}
          previous={previous}
          isLoadingMore={isLoadingMore}
        />
      </Box>
      <Flex align="center" mb="2">
        {filters.map(({ comparison, filterValue }, idx) => {
          return (
            <Tag fontSize="lg" borderWidth="1px" borderColor="gray.300" key={idx} mx="1" my="1" bg="gray.100">
              {comparison === 'NOT_EQUAL' && <Text mr="1">!</Text>}
              <TagLabel>{filterValue}</TagLabel>
              <TagCloseButton onClick={() => setFilters(filters.filter((_, i) => i !== idx))} />
            </Tag>
          )
        })}
      </Flex>
      {adminDomainList}
      <RelayPaginationControls
        onlyPagination={false}
        selectedDisplayLimit={domainsPerPage}
        setSelectedDisplayLimit={setDomainsPerPage}
        displayLimitOptions={[5, 10, 20, 50, 100]}
        resetToFirstPage={resetToFirstPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
      />
      <AdminDomainModal
        isOpen={updateIsOpen}
        onClose={
          modalProps.mutation === 'create'
            ? () => {
                updateOnClose()
                resetToFirstPage()
              }
            : updateOnClose
        }
        validationSchema={createValidationSchema(['domainUrl', 'selectors'])}
        orgId={orgId}
        orgSlug={orgSlug}
        permission={permission}
        {...modalProps}
      />
      <Modal isOpen={removeIsOpen} onClose={removeOnClose} motionPreset="slideInBottom">
        <ModalOverlay />
        <ModalContent pb={4}>
          <Formik
            initialValues={{
              reason: selectedRemoveProps.rcode === 'NXDOMAIN' ? 'NONEXISTENT' : '',
            }}
            initialTouched={{
              reason: true,
            }}
            onSubmit={async (values) => {
              removeDomain({
                variables: {
                  domainId: selectedRemoveProps.domainId,
                  orgId: orgId,
                  reason: values.reason,
                },
              })
            }}
          >
            {({ values, handleSubmit, isSubmitting, handleChange }) => (
              <form id="form" onSubmit={handleSubmit}>
                <ModalHeader>
                  <Trans>Remove Domain</Trans>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Stack spacing={4} p={25}>
                    <Text>
                      <Trans>Confirm removal of domain:</Trans>
                    </Text>
                    <Text fontWeight="bold">{selectedRemoveProps.domain}</Text>

                    <Text>
                      <Trans>
                        A domain may only be removed for one of the reasons below. For a domain to no longer exist, it
                        must be removed from the DNS. If you need to remove this domain for a different reason, please
                        contact TBS Cyber Security.
                      </Trans>
                    </Text>

                    <FormControl>
                      <FormLabel htmlFor="reason" fontWeight="bold">
                        <Trans>Reason</Trans>
                      </FormLabel>
                      <Select
                        isRequired
                        defaultValue={values.reason}
                        borderColor="black"
                        name="reason"
                        id="reason"
                        onChange={handleChange}
                      >
                        <option hidden value="">
                          <Trans>Select a reason for removing this domain</Trans>
                        </option>
                        <option value="NONEXISTENT">
                          <Trans>This domain no longer exists</Trans>
                        </option>
                        <option value="WRONG_ORG">
                          <Trans>This domain does not belong to this organization</Trans>
                        </option>
                      </Select>
                    </FormControl>
                  </Stack>
                </ModalBody>

                <ModalFooter>
                  <Button variant="primary" mr={4} isLoading={isSubmitting} type="submit">
                    <Trans>Confirm</Trans>
                  </Button>
                </ModalFooter>
              </form>
            )}
          </Formik>
        </ModalContent>
      </Modal>
    </Stack>
  )
}

AdminDomains.propTypes = {
  orgSlug: string.isRequired,
  orgId: string.isRequired,
  domainsPerPage: number,
  permission: string,
}
