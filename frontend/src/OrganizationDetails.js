import React from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { ArrowLeftIcon, CheckCircleIcon } from '@chakra-ui/icons'
import { ORG_DETAILS_PAGE } from './graphql/queries'
import { LEAVE_ORG } from './graphql/mutations'
import { Link as RouteLink, useParams } from 'react-router-dom'
import { OrganizationSummary } from './OrganizationSummary'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { OrganizationDomains } from './OrganizationDomains'
import { OrganizationAffiliations } from './OrganizationAffiliations'
import { useDocumentTitle } from './useDocumentTitle'

export default function OrganizationDetails() {
  const { orgSlug } = useParams()
  const toast = useToast()
  const { i18n } = useLingui()

  useDocumentTitle(`${orgSlug}`)

  const { loading, _error, data } = useQuery(ORG_DETAILS_PAGE, {
    variables: { slug: orgSlug },
    errorPolicy: 'ignore', // allow partial success
  })

  const [leaveOrganization] = useMutation(LEAVE_ORG, {
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
    onCompleted({ leaveOrganization }) {
      if (leaveOrganization.result.__typename === 'LeaveOrganizationResult') {
        toast({
          title: i18n._(t`Organization left successfully`),
          description: i18n._(t`You have successfully left ${orgSlug}`),
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        leaveOrgOnClose()
      } else if (leaveOrganization.result.__typename === 'AffiliationError') {
        toast({
          title: i18n._(t`Unable to leave organization.`),
          description: leaveOrganization.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: i18n._(t`Incorrect send method received.`),
          description: i18n._(t`Incorrect leaveOrganization.result typename.`),
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect leaveOrganization.result typename.')
      }
    },
  })

  const {
    isOpen: leaveOrgIsOpen,
    onOpen: leaveOrgOnOpen,
    onClose: leaveOrgOnClose,
  } = useDisclosure()

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Organization Details</Trans>
      </LoadingMessage>
    )
  }

  const orgName = data?.organization?.name ?? ''

  return (
    <Box w="100%" px={4}>
      <Flex
        flexDirection="row"
        align="center"
        mb="4"
        flexWrap={{ base: 'wrap', md: 'nowrap' }}
      >
        <IconButton
          icon={<ArrowLeftIcon />}
          as={RouteLink}
          to={'/organizations'}
          color="gray.900"
          fontSize="2xl"
          aria-label="back to organizations"
          mr="0.5rem"
          order={0}
        />
        <Heading
          as="h1"
          textAlign={{ base: 'center', md: 'left' }}
          mr={{ base: '0', md: '0.5rem' }}
          order={{ base: 2, md: 1 }}
          flexBasis={{ base: '100%', md: 'auto' }}
        >
          {orgName}
          {data?.organization?.verified && (
            <>
              {' '}
              <CheckCircleIcon color="blue.500" boxSize="icons.lg" />
            </>
          )}
        </Heading>{' '}
        <Button
          variant="danger"
          order={{ base: 1, md: 2 }}
          onClick={() => {
            leaveOrgOnOpen()
          }}
          flexShrink={0}
          ml="auto"
        >
          <Trans> Leave Organization </Trans>
        </Button>
      </Flex>
      <Tabs isFitted>
        <TabList mb="4">
          <Tab>
            <Trans>Summary</Trans>
          </Tab>
          <Tab>
            <Trans>Domains</Trans>
          </Tab>
          {!isNaN(data?.organization?.affiliations?.totalCount) && (
            <Tab>
              <Trans>Users</Trans>
            </Tab>
          )}
        </TabList>

        <TabPanels>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <OrganizationSummary
                summaries={data?.organization?.summaries}
                domainCount={data?.organization?.domainCount}
                userCount={data?.organization?.affiliations?.totalCount}
                city={data?.organization?.city}
                province={data?.organization?.province}
              />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <OrganizationDomains orgSlug={orgSlug} domainsPerPage={10} />
            </ErrorBoundary>
          </TabPanel>
          {!isNaN(data?.organization?.affiliations?.totalCount) && (
            <TabPanel>
              <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                <OrganizationAffiliations orgSlug={orgSlug} usersPerPage={10} />
              </ErrorBoundary>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      <Modal
        isOpen={leaveOrgIsOpen}
        onClose={leaveOrgOnClose}
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent pb={4}>
          <ModalHeader>
            <Trans>Leave Organization</Trans>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Trans>
              Are you sure you wish to leave {orgName}? You will have to be
              invited back in to access it.
            </Trans>
          </ModalBody>

          <ModalFooter>
            <Button variant="primaryOutline" mr="4" onClick={leaveOrgOnClose}>
              <Trans>Cancel</Trans>
            </Button>

            <Button
              variant="primary"
              mr="4"
              onClick={async () => {
                await leaveOrganization({
                  variables: {
                    orgId: data?.organization?.id,
                  },
                })
              }}
            >
              <Trans>Confirm</Trans>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
