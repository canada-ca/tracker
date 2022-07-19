import React, { useCallback, useState } from 'react'
import { t, Trans } from '@lingui/macro'
import {
  Box,
  Button,
  Divider,
  Flex,
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

export function AdminDomains({ orgSlug, domainsPerPage, orgId }) {
  const toast = useToast()
  const { i18n } = useLingui()

  const [newDomainUrl, setNewDomainUrl] = useState('')
  const [editingDomainUrl, setEditingDomainUrl] = useState()
  const [editingDomainId, setEditingDomainId] = useState()
  const [selectedRemoveDomainUrl, setSelectedRemoveDomainUrl] = useState()
  const [selectedRemoveDomainId, setSelectedRemoveDomainId] = useState()
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectorInputList, setSelectorInputList] = useState([])
  const [mutation, setMutation] = useState()

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
    recordsPerPage: domainsPerPage,
    variables: { orgSlug, search: debouncedSearchTerm },
    relayRoot: 'findOrganizationBySlug.domains',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  })

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(newDomainUrl)
  }, [newDomainUrl])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const [removeDomain, { loading: removeDomainLoading }] = useMutation(
    REMOVE_DOMAIN,
    {
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
    },
  )

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
      {({ id: domainId, domain, selectors, claimTags }, index) => (
        <Box key={'admindomain' + index}>
          <Stack isInline align="center">
            <Stack direction="row" flexGrow="0">
              <IconButton
                data-testid={`remove-${index}`}
                onClick={() => {
                  setSelectedRemoveDomainUrl(domain)
                  setSelectedRemoveDomainId(domainId)
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
                  setEditingDomainUrl(domain)
                  setEditingDomainId(domainId)
                  setSelectorInputList(selectors)
                  setMutation('update')
                  updateOnOpen()
                }}
                icon={<EditIcon />}
                aria-label={'Edit ' + domain}
              />
            </Stack>
            <AdminDomainCard
              url={domain}
              tags={claimTags}
              flexGrow={1}
              fontSize={{ base: '75%', sm: '100%' }}
            />
          </Stack>
          <Divider borderColor="gray.900" />
        </Box>
      )}
    </ListOf>
  )

  return (
    <Stack mb="6" w="100%">
      <form
        id="form"
        onSubmit={async (e) => {
          e.preventDefault() // prevents page from refreshing
          setSelectorInputList([])
          setEditingDomainUrl(newDomainUrl)
          setMutation('create')
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
          <InputGroup
            width={{ base: '100%', md: '75%' }}
            mb={{ base: '8px', md: '0' }}
            mr={{ base: '0', md: '4' }}
          >
            <InputLeftElement aria-hidden="true">
              <PlusSquareIcon color="gray.300" />
            </InputLeftElement>
            <Input
              id="Search-for-domain-field"
              type="text"
              placeholder={i18n._(t`Domain URL`)}
              aria-label={i18n._(t`Search by Domain URL`)}
              onChange={(e) => setNewDomainUrl(e.target.value)}
            />
          </InputGroup>
          <Button
            id="addDomainBtn"
            width={{ base: '100%', md: '25%' }}
            variant="primary"
            type="submit"
          >
            <AddIcon mr={2} aria-hidden="true" />
            <Trans>Add Domain</Trans>
          </Button>
        </Flex>
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

      <AdminDomainModal
        isOpen={updateIsOpen}
        onClose={updateOnClose}
        validationSchema={createValidationSchema(['domainUrl', 'selectors'])}
        orgId={orgId}
        orgSlug={orgSlug}
        selectorInputList={selectorInputList}
        editingDomainId={editingDomainId}
        editingDomainUrl={editingDomainUrl}
        mutation={mutation}
      />

      <Modal
        isOpen={removeIsOpen}
        onClose={removeOnClose}
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent pb={4}>
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
            <Button
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
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  )
}

AdminDomains.propTypes = {
  orgSlug: string.isRequired,
  orgId: string.isRequired,
  domainsPerPage: number,
}
