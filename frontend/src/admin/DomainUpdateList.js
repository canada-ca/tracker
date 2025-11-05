import React, { useState, useRef } from 'react'
import {
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Checkbox,
  Box,
  Button,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  VisuallyHidden,
  CheckboxGroup,
  Tbody,
  Text,
  Flex,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/react'
import { useMutation } from '@apollo/client'
import { array, number, string } from 'prop-types'
import { t, Trans } from '@lingui/macro'
import { UPDATE_DOMAINS_BY_DOMAIN_IDS, UPDATE_DOMAINS_BY_FILTERS } from '../graphql/mutations'

export function DomainUpdateList({ orgId, domains, availableTags, filters, search, domainCount }) {
  const toast = useToast()
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectAllPage, setSelectAllPage] = useState(false)
  const [selectAllGlobal, setSelectAllGlobal] = useState(false)
  const [tags, setTags] = useState([])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure()

  const resetSelections = () => {
    setSelectedIds(new Set())
    setSelectAllPage(false)
    setSelectAllGlobal(false)
    setTags([])
  }

  const [updateDomainsByDomainIds, { loading: idLoading }] = useMutation(UPDATE_DOMAINS_BY_DOMAIN_IDS, {
    refetchQueries: ['PaginatedOrgDomains', 'FindAuditLogs'],
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
    onCompleted({ updateDomainsByDomainIds }) {
      if (updateDomainsByDomainIds.result.__typename === 'DomainBulkResult') {
        onClose()
        resetSelections()
        toast({
          title: t`Domains updated.`,
          description: updateDomainsByDomainIds.result.status,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else if (updateDomainsByDomainIds.result.__typename === 'DomainError') {
        toast({
          title: t`Unable to update domains.`,
          description: updateDomainsByDomainIds.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect updateDomainsByDomainIds.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect updateDomainsByDomainIds.result typename.')
      }
    },
  })
  const [updateDomainsByFilters, { loading: filterLoading }] = useMutation(UPDATE_DOMAINS_BY_FILTERS, {
    refetchQueries: ['PaginatedOrgDomains', 'FindAuditLogs'],
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
    onCompleted({ updateDomainsByFilters }) {
      if (updateDomainsByFilters.result.__typename === 'DomainBulkResult') {
        onClose()
        resetSelections()
        toast({
          title: t`Domains updated.`,
          description: updateDomainsByFilters.result.status,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else if (updateDomainsByFilters.result.__typename === 'DomainError') {
        toast({
          title: t`Unable to update domains.`,
          description: updateDomainsByFilters.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect updateDomainsByDomainIds.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect updateDomainsByFilters.result typename.')
      }
    },
  })

  const liveRegionRef = useRef(null)

  // selection handlers
  const toggleDomain = (id) => {
    let newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
    setSelectAllPage(newSet.size === domains.length)
    setSelectAllGlobal(false)

    if (liveRegionRef.current) {
      if (newSet.size === 0) {
        liveRegionRef.current.textContent = 'Selection cleared.'
      } else if (newSet.size === domains.length) {
        liveRegionRef.current.textContent = `All ${domains.length} domains on this page are selected.`
      } else {
        liveRegionRef.current.textContent = `${newSet.size} domain(s) selected.`
      }
    }
  }

  const handleSelectAllPage = () => {
    if (selectAllPage) {
      resetSelections()
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = 'Selection cleared.'
      }
    } else {
      const newSet = new Set(domains.map((d) => d.id))
      setSelectedIds(newSet)
      setSelectAllPage(true)
      setSelectAllGlobal(false)
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = `All ${domains.length} domains on this page are selected.`
      }
    }
  }

  const handleSelectAllGlobal = () => {
    setSelectAllGlobal(true)
    setSelectAllPage(true)
    setSelectedIds(new Set(domains.map((d) => d.id)))
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = `All ${domainCount} domains are selected.`
    }
  }

  const handleConfirmSubmit = async () => {
    if (selectAllGlobal) {
      await updateDomainsByFilters({
        variables: { filters, search, tags, orgId },
      })
    } else {
      await updateDomainsByDomainIds({
        variables: { domainIds: Array.from(selectedIds), tags, orgId },
      })
    }
    onConfirmClose()
  }

  // Render all rows
  const rows = domains.map((d) => {
    const isChecked = selectedIds.has(d.id)
    return (
      <Tr key={d.id}>
        <Td>
          <Checkbox borderColor="gray.900" isChecked={isChecked} onChange={() => toggleDomain(d.id)} />
        </Td>
        <Td>{d.domain}</Td>
        <Td>{d.tags.join(', ').toUpperCase()}</Td>
      </Tr>
    )
  })

  return (
    <Box>
      <Table variant="striped">
        <Thead>
          <Tr>
            <Th w="15%" minW="40px" maxW="60px">
              <Flex>
                <Checkbox
                  id="select-all-checkbox"
                  borderColor="gray.900"
                  isChecked={selectAllPage}
                  isIndeterminate={selectedIds.size > 0 && selectedIds.size < domains.length}
                  onChange={handleSelectAllPage}
                  mr="2"
                />
                <label htmlFor="select-all-checkbox">
                  <Trans>Select All</Trans>
                </label>
              </Flex>
            </Th>
            <Th>
              <Trans>Domain</Trans>
            </Th>
            <Th>
              <Trans>Current Tags</Trans>
            </Th>
          </Tr>
        </Thead>
        <Tbody>{rows}</Tbody>
      </Table>

      {/* Selection banner */}
      {selectedIds.size > 0 && !selectAllGlobal && (
        <Box bg="moderateMuted" borderRadius="md" p={3} my={3}>
          <Flex align="center" justify="space-between">
            <Text>
              <Trans>All {selectedIds.size} domain(s) on this page are selected.</Trans>
            </Text>
            {domainCount > domains.length && (
              <Button size="sm" variant="link" colorScheme="blue" onClick={handleSelectAllGlobal}>
                <Trans>Select all {domainCount} domains</Trans>
              </Button>
            )}
          </Flex>
        </Box>
      )}
      {selectAllGlobal && (
        <Box bg="strongMuted" borderRadius="md" p={3} my={3}>
          <Text>
            <Trans>
              All {domainCount} domains are selected. Updates will apply to all filtered domains, not just this page.
            </Trans>
          </Text>
        </Box>
      )}

      {/* Show number selected */}
      {selectedIds.size > 0 && !selectAllGlobal && (
        <Text mt={2} fontSize="sm" color="gray.600">
          <Trans>{selectedIds.size} selected</Trans>
        </Text>
      )}
      {selectAllGlobal && (
        <Text mt={2} fontSize="sm" color="gray.600">
          <Trans>All {domainCount} selected</Trans>
        </Text>
      )}

      <Button variant="primary" my={4} onClick={onOpen} isDisabled={selectedIds.size === 0 && !selectAllGlobal}>
        <Trans>Tag Assets</Trans>
      </Button>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>
            <Trans>Apply Tags</Trans>
          </DrawerHeader>
          <DrawerBody>
            <CheckboxGroup value={tags} onChange={(values) => setTags(values)}>
              {availableTags.map(({ label, tagId }) => {
                return (
                  <Box key={tagId}>
                    <Checkbox borderColor="gray.900" value={tagId} mr={2}>
                      {label.toUpperCase()}
                    </Checkbox>
                  </Box>
                )
              })}
            </CheckboxGroup>
          </DrawerBody>
          <DrawerFooter>
            <Button onClick={onConfirmOpen} variant="primary" isLoading={idLoading || filterLoading}>
              <Trans>Apply</Trans>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={onConfirmClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Trans>Are you sure?</Trans>
          </ModalHeader>
          <ModalBody>
            <Text mb={4}>
              <Trans>This will update {selectAllGlobal ? domainCount : selectedIds.size} domain(s).</Trans>
            </Text>
            <Text>
              <Trans>Are you sure you want to apply these tag changes?</Trans>
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleConfirmSubmit} colorScheme="red" mr={3} isLoading={idLoading || filterLoading}>
              <Trans>Yes, Apply</Trans>
            </Button>
            <Button onClick={onConfirmClose} variant="outline">
              <Trans>Cancel</Trans>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <VisuallyHidden>
        <div aria-live="polite" ref={liveRegionRef}></div>
      </VisuallyHidden>
    </Box>
  )
}

DomainUpdateList.propTypes = {
  domains: array,
  filters: array,
  availableTags: array,
  orgId: string,
  search: string,
  domainCount: number,
}
