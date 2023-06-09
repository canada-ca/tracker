import React, { useCallback, useEffect, useState } from 'react'
import { t, Trans } from '@lingui/macro'
import {
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
import { createValidationSchema } from '../utilities/fieldRequirements'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { PAGINATED_ORG_DOMAINS_ADMIN_PAGE as FORWARD } from '../graphql/queries'
import { REMOVE_DOMAIN } from '../graphql/mutations'
import { Formik } from 'formik'

export function AdminDomains({ orgSlug, orgId, permission }) {
  const toast = useToast()
  const { i18n } = useLingui()

  const [newDomainUrl, setNewDomainUrl] = useState('')
  const [domainsPerPage, setDomainsPerPage] = useState(10)
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

  const { isOpen: updateIsOpen, onOpen: updateOnOpen, onClose: updateOnClose } = useDisclosure()
  const { isOpen: removeIsOpen, onOpen: removeOnOpen, onClose: removeOnClose } = useDisclosure()

  const fetchVariables = {
    orgSlug,
    search: debouncedSearchTerm,
    orderBy: { field: 'DOMAIN', direction: 'ASC' },
  }

  const {
    loading,
    isLoadingMore,
    error,
    nodes,
    next,
    previous,
    resetToFirstPage,
    hasNextPage,
    hasPreviousPage,
    endCursor,
  } = usePaginatedCollection({
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
    refetchQueries: [
      { query: FORWARD, variables: { after: endCursor, first: domainsPerPage, ...fetchVariables } },
      'FindAuditLogs',
    ],
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

  const adminDomainList = loading ? (
    <LoadingMessage minH="50px">
      <Trans>Domain List</Trans>
    </LoadingMessage>
  ) : (
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
  )

  return (
    <Stack mb="6" w="100%">
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
          <Text as="label" htmlFor="Search-for-domain-field" fontSize="md" fontWeight="bold" textAlign="center" mr={2}>
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
        onClose={updateOnClose}
        validationSchema={createValidationSchema(['domainUrl', 'selectors'])}
        orgId={orgId}
        orgSlug={orgSlug}
        {...modalProps}
        permission={permission}
        refetchQuery={{ query: FORWARD, variables: { after: endCursor, first: domainsPerPage, ...fetchVariables } }}
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
