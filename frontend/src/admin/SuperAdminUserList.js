import React, { useCallback, useState } from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
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

import { FIND_MY_USERS } from '../graphql/queries'
import { CLOSE_ACCOUNT_OTHER } from '../graphql/mutations'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { Trans, t } from '@lingui/macro'
import { CheckCircleIcon, EditIcon, MinusIcon } from '@chakra-ui/icons'
import { SearchBox } from '../components/SearchBox'
import { UserListModal } from './UserListModal'
import { FormField } from '../components/fields/FormField'
import { createValidationSchema } from '../utilities/fieldRequirements'
import { Formik } from 'formik'
import { useMutation } from '@apollo/client'

export function SuperAdminUserList() {
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('USER_USERNAME')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [usersPerPage, setUsersPerPage] = useState(10)
  const [editUserRole, setEditUserRole] = useState({
    mutation: '',
    userName: '',
    displayName: '',
    userId: '',
    userRole: '',
    orgName: '',
    orgId: '',
  })

  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: closeAccountIsOpen, onOpen: closeAccountOnOpen, onClose: closeAccountOnClose } = useDisclosure()

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const [closeAccount, { loading: loadingCloseAccount }] = useMutation(CLOSE_ACCOUNT_OTHER, {
    refetchQueries: ['FindMyUsers'],
    awaitRefetchQueries: true,

    onError(error) {
      toast({
        title: t`Unable to close this account.`,
        description: error.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ closeAccount }) {
      if (closeAccount.result.__typename === 'CloseAccountResult') {
        toast({
          title: t`Account Closed Successfully`,
          description: t`Tracker account has been successfully closed.`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        closeAccountOnClose()
      } else if (closeAccount.result.__typename === 'CloseAccountError') {
        toast({
          title: t`Unable to close the account.`,
          description: closeAccount.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect closeAccount.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      }
    },
  })

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
    totalCount,
  } = usePaginatedCollection({
    fetchForward: FIND_MY_USERS,
    recordsPerPage: usersPerPage,
    relayRoot: 'findMyUsers',
    variables: {
      orderBy: { field: orderField, direction: orderDirection },
      search: debouncedSearchTerm,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'ignore', // allow partial success
  })

  if (error) return <ErrorFallbackMessage error={error} />

  const orderByOptions = [
    { value: 'USER_USERNAME', text: t`Email` },
    { value: 'USER_DISPLAYNAME', text: t`Display Name` },
    { value: 'USER_EMAIL_VALIDATED', text: t`Verified` },
    { value: 'USER_INSIDER', text: t`Inside User` },
  ]

  const userList =
    loading || isLoadingMore ? (
      <LoadingMessage>
        <Trans>User List</Trans>
      </LoadingMessage>
    ) : nodes.length === 0 ? (
      <Text layerStyle="loadingMessage">
        <Trans>No users</Trans>
      </Text>
    ) : (
      nodes.map(({ id: userId, userName, displayName, emailValidated, insideUser, affiliations }) => {
        const { totalCount, edges: orgEdges } = affiliations
        const orgNodes = orgEdges?.map((e) => e.node)
        let userAffiliations
        if (totalCount === 0) {
          userAffiliations = (
            <Box
              justify="space-between"
              borderColor="black"
              borderWidth="1px"
              rounded="md"
              align="center"
              p="2"
              w="100%"
            >
              <Text>
                <Trans>This user is not affiliated with any organizations</Trans>
              </Text>
            </Box>
          )
        } else {
          userAffiliations = orgNodes.map(({ permission: userRole, organization }, idx) => {
            if (!organization) {
              return (
                <Box
                  key={`org-err-${idx}`}
                  justify="space-between"
                  borderColor="black"
                  borderWidth="1px"
                  rounded="md"
                  align="center"
                  p="2"
                  w="100%"
                >
                  <Text>
                    <Trans>An error occurred when fetching this organization's information</Trans>
                  </Text>
                </Box>
              )
            }
            const { id: orgId, name: orgName, acronym, slug, verified } = organization
            return (
              <Flex key={orgId} align="center" p="1" w="100%">
                <Stack direction="row" flexGrow="0" mr="2">
                  <IconButton
                    aria-label={`Remove ${userName} from ${orgName}`}
                    variant="danger"
                    onClick={() => {
                      setEditUserRole({
                        mutation: 'remove',
                        userId,
                        userName,
                        userRole,
                        orgName,
                        orgId,
                      })
                      onOpen()
                    }}
                    p="2"
                    icon={<MinusIcon />}
                  />
                  <IconButton
                    aria-label={`Edit ${userName} in ${orgName}`}
                    variant="primary"
                    onClick={() => {
                      setEditUserRole({
                        mutation: 'update',
                        userId,
                        userName,
                        userRole,
                        orgName,
                        orgId,
                      })
                      onOpen()
                    }}
                    p="2"
                    icon={<EditIcon />}
                  />
                </Stack>
                <Flex
                  justify="space-between"
                  borderColor="black"
                  borderWidth="1px"
                  rounded="md"
                  align="center"
                  p="2"
                  w="100%"
                >
                  <Text fontWeight="bold">
                    {orgName} ({acronym}){' '}
                    {verified && (
                      <CheckCircleIcon color="blue.500" size="icons.sm" aria-label="Verified Organization" />
                    )}
                  </Text>
                  <Badge
                    variant="solid"
                    bg={userRole === 'USER' ? 'primary' : userRole === 'ADMIN' ? 'info' : 'weak'}
                    pt={1}
                    mr={{ md: '1rem' }}
                    justifySelf={{ base: 'start', md: 'end' }}
                  >
                    {userRole}
                  </Badge>
                </Flex>
                <UserListModal
                  isOpen={isOpen}
                  onClose={onClose}
                  orgId={editUserRole.orgId}
                  editingUserName={editUserRole.userName}
                  editingUserRole={editUserRole.userRole}
                  editingUserId={editUserRole.userId}
                  orgSlug={slug}
                  orgName={editUserRole.orgName}
                  permission={'SUPER_ADMIN'}
                  mutation={editUserRole.mutation}
                />
              </Flex>
            )
          })
        }

        return (
          <AccordionItem key={userId}>
            <Box>
              <Flex w="100%">
                <AccordionButton
                  width="100%"
                  p="4"
                  alignItems={{ base: 'flex-start', md: 'center' }}
                  flexDirection={{ base: 'column', md: 'row' }}
                  _hover={{ bg: 'gray.100' }}
                  mb="2"
                  borderWidth="1px"
                  borderColor="black"
                  rounded="md"
                >
                  <Flex w="100%" textAlign="left">
                    <Text minW="33%">{userName}</Text>
                    <Text minW="25%">{displayName}</Text>
                    <Flex minW="25%">
                      <Badge
                        variant="solid"
                        bg={emailValidated ? 'strong' : 'weak'}
                        pt={1}
                        mr={{ md: '1rem' }}
                        justifySelf={{ base: 'start', md: 'end' }}
                      >
                        <Trans>Verified</Trans>
                      </Badge>
                      {insideUser && (
                        <Badge
                          variant="solid"
                          bg="strong"
                          pt={1}
                          mr={{ md: '1rem' }}
                          justifySelf={{ base: 'start', md: 'end' }}
                        >
                          <Trans>Inside User</Trans>
                        </Badge>
                      )}
                    </Flex>
                    <Text minW="17%">
                      <Trans>Affiliations:</Trans> {totalCount}
                    </Text>
                  </Flex>
                </AccordionButton>
                <Button
                  alignSelf="center"
                  variant="danger"
                  onClick={() => {
                    setEditUserRole({ userId, userName, displayName })
                    closeAccountOnOpen()
                  }}
                  w={{ base: '100%', md: 'auto' }}
                  mx="2"
                  mb="2"
                >
                  <Trans>Close Account</Trans>
                </Button>
              </Flex>
              <AccordionPanel>{userAffiliations}</AccordionPanel>
            </Box>

            <Modal isOpen={closeAccountIsOpen} onClose={closeAccountOnClose} motionPreset="slideInBottom">
              <Formik
                validateOnBlur={false}
                initialValues={{
                  matchEmail: '',
                }}
                initialTouched={{
                  matchEmail: true,
                }}
                validationSchema={createValidationSchema(['matchEmail'], {
                  matches: editUserRole.userName,
                })}
                onSubmit={async () => {
                  await closeAccount({
                    variables: { userId: editUserRole.userId },
                  })
                }}
              >
                {({ handleSubmit }) => (
                  <form onSubmit={handleSubmit}>
                    <ModalOverlay />
                    <ModalContent pb={4}>
                      <ModalHeader>
                        <Trans>Close Account</Trans>
                      </ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <Trans>
                          This action CANNOT be reversed, are you sure you wish to to close the account{' '}
                          {editUserRole.displayName}?
                        </Trans>

                        <Text mb="1rem">
                          <Trans>
                            Enter "{editUserRole.userName}" below to confirm removal. This field is case-sensitive.
                          </Trans>
                        </Text>

                        <FormField name="matchEmail" label={t`User Email`} placeholder={editUserRole.userName} />
                      </ModalBody>

                      <ModalFooter>
                        <Button variant="primaryOutline" mr="4" onClick={closeAccountOnClose}>
                          <Trans>Cancel</Trans>
                        </Button>

                        <Button variant="primary" mr="4" type="submit" isLoading={loadingCloseAccount}>
                          <Trans>Confirm</Trans>
                        </Button>
                      </ModalFooter>
                    </ModalContent>
                  </form>
                )}
              </Formik>
            </Modal>
          </AccordionItem>
        )
      })
    )

  return (
    <Box>
      <SearchBox
        selectedDisplayLimit={usersPerPage}
        setSelectedDisplayLimit={setUsersPerPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
        orderDirection={orderDirection}
        setSearchTerm={setSearchTerm}
        setOrderField={setOrderField}
        setOrderDirection={setOrderDirection}
        resetToFirstPage={resetToFirstPage}
        orderByOptions={orderByOptions}
        placeholder={t`Search for a user (email)`}
        totalRecords={totalCount}
      />
      <Accordion defaultIndex={[]}>{userList}</Accordion>
      <RelayPaginationControls
        onlyPagination={false}
        selectedDisplayLimit={usersPerPage}
        setSelectedDisplayLimit={setUsersPerPage}
        displayLimitOptions={[5, 10, 20, 50, 100]}
        resetToFirstPage={resetToFirstPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
        totalRecords={totalCount}
      />
    </Box>
  )
}
