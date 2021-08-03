import React from 'react'
import { useMutation } from '@apollo/client'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  Box,
  Button,
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
import { SummaryGroup } from './SummaryGroup'
import { LEAVE_ORG } from './graphql/mutations'
import { number, object, string } from 'prop-types'

export function OrganizationSummary({
  summaries,
  domainCount,
  userCount,
  city,
  province,
  slug,
  name,
  id,
}) {
  const toast = useToast()
  const { i18n } = useLingui()

  const [leaveOrg] = useMutation(LEAVE_ORG, {
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
          description: i18n._(t`You have successfully left ${slug}`),
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

  return (
    <Box w="100%" px={4}>
      <Button
        variant="danger"
        onClick={() => {
          leaveOrgOnOpen()
        }}
        ml="auto"
        w={{ base: '100%', md: 'auto' }}
        mb={2}
      >
        <Trans> Leave Organization </Trans>
      </Button>
      <Stack fontSize="xl" align={{ base: 'center', md: 'flex-start' }}>
        <Stack isInline align="center">
          <Text>
            <Trans>Based in:</Trans>
          </Text>
          <Text fontWeight="semibold">
            {city}, {province}
          </Text>
        </Stack>

        <Stack isInline align="center">
          <Text fontWeight="semibold">{domainCount}</Text>
          <Text>
            <Trans>Internet facing domains</Trans>
          </Text>
        </Stack>

        {!isNaN(userCount) && (
          <Stack isInline align="center">
            <Text fontWeight="semibold">{userCount}</Text>
            <Text>
              <Trans>Total users</Trans>
            </Text>
          </Stack>
        )}
      </Stack>
      <SummaryGroup web={summaries?.web} mail={summaries?.mail} />

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
              Are you sure you wish to leave {name}? You will have to be invited
              back in to access it.
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
                await leaveOrg({
                  variables: {
                    orgId: id,
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

OrganizationSummary.propTypes = {
  summaries: object,
  domainCount: number,
  userCount: number,
  city: string,
  province: string,
  slug: string,
  name: string,
  id: string,
}
