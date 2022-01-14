import React, { useRef, useState } from 'react'
import {
  Box,
  Button,
  Collapse,
  Flex,
  Grid,
  Heading,
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
import { CheckCircleIcon, MinusIcon, EditIcon } from '@chakra-ui/icons'
import { bool, func, string } from 'prop-types'
import { useMutation, useQuery } from '@apollo/client'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Formik } from 'formik'

import { ORGANIZATION_INFORMATION } from '../graphql/queries'
import {
  REMOVE_ORGANIZATION,
  UPDATE_ORGANIZATION,
  LEAVE_ORG,
} from '../graphql/mutations'
import { FormField } from '../components/fields/FormField'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import {
  getRequirement,
  schemaToValidation,
} from '../utilities/fieldRequirements'
import { useHistory } from 'react-router-dom'

export function OrganizationInformation({
  orgSlug,
  removeOrgCallback: setSelectedOrg,
  isLoginRequired,
  ...props
}) {
  const toast = useToast()
  const { i18n } = useLingui()
  const history = useHistory()
  const {
    isOpen: isRemovalOpen,
    onOpen: onRemovalOpen,
    onClose: onRemovalClose,
  } = useDisclosure()
  const {
    isOpen: leaveOrgIsOpen,
    onOpen: leaveOrgOnOpen,
    onClose: leaveOrgOnClose,
  } = useDisclosure()
  const removeOrgBtnRef = useRef()
  const [isEditingOrg, setIsEditingOrg] = useState(false)

  const { loading, error, data } = useQuery(ORGANIZATION_INFORMATION, {
    variables: {
      orgSlug,
    },
    onError: (error) => {
      const [_, message] = error.message.split(': ')
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  const [removeOrganization, { loading: removeOrgLoading }] = useMutation(
    REMOVE_ORGANIZATION,
    {
      onError: ({ message }) => {
        toast({
          title: t`An error occurred while removing this organization.`,
          description: message,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
      onCompleted({ removeOrganization }) {
        // eslint-disable-next-line no-empty
        if (removeOrganization.result.__typename === 'OrganizationResult') {
        } else if (
          removeOrganization.result.__typename === 'OrganizationError'
        ) {
          toast({
            title: t`Unable to remove this organization.`,
            description: removeOrganization.result.description,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else {
          toast({
            title: t`Incorrect typename received.`,
            description: t`Incorrect removeOrganization.result typename.`,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          console.log('Incorrect removeOrganization.result typename.')
        }
      },
      update: (cache, { data }) => {
        if (data.removeOrganization.result.__typename !== 'OrganizationResult')
          return

        toast({
          title: t`Removed Organization`,
          description: t`You have successfully removed ${data.removeOrganization.result.organization.name}.`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })

        const removedOrgId = cache.identify(
          data.removeOrganization.result.organization,
        )

        // Set admin page org <Select> to none, as the current is removed
        setSelectedOrg('none')

        cache.evict({ id: removedOrgId })
      },
    },
  )

  const [updateOrganization, { loading: updateOrgLoading }] = useMutation(
    UPDATE_ORGANIZATION,
    {
      onError: ({ message }) => {
        toast({
          title: t`An error occurred while updating this organization.`,
          description: message,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
      onCompleted({ updateOrganization }) {
        if (updateOrganization.result.__typename === 'Organization') {
          toast({
            title: t`Updated Organization`,
            description: t`You have successfully updated ${updateOrganization.result.name}.`,
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else if (
          updateOrganization.result.__typename === 'OrganizationError'
        ) {
          toast({
            title: t`Unable to update this organization.`,
            description: updateOrganization.result.description,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else {
          toast({
            title: t`Incorrect typename received.`,
            description: t`Incorrect updateOrganization.result typename.`,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          console.log('Incorrect updateOrganization.result typename.')
        }
      },
    },
  )

  const [leaveOrganization, { loading: loadingLeaveOrg }] = useMutation(
    LEAVE_ORG,
    {
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
          history.go(0)
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
            description: i18n._(
              t`Incorrect leaveOrganization.result typename.`,
            ),
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          console.log('Incorrect leaveOrganization.result typename.')
        }
      },
    },
  )

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Organization Information</Trans>
      </LoadingMessage>
    )
  }

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  const org = data.findOrganizationBySlug

  const updateOrgValidationSchema = schemaToValidation({
    acronymEN: getRequirement('acronym'),
    acronymFR: getRequirement('acronym'),
  })

  const removeOrgValidationSchema = schemaToValidation({
    orgName: getRequirement('field').matches(
      org.name,
      t`Organization name does not match.`,
    ),
  })

  return (
    <>
      <Box {...props}>
        <Flex align="center" mb="1em" flexWrap="wrap">
          <Stack
            isInline
            align="center"
            flexGrow={1}
            flexShrink={0}
            flexBasis={{ base: '100%', md: '0' }}
            mb={{ base: '0.5em', md: '0' }}
            fontSize="3xl"
          >
            <Heading as="h1">
              {org.name}{' '}
              {org.verified && (
                <CheckCircleIcon color="blue.500" boxSize="icons.md" />
              )}
            </Heading>
          </Stack>

          <Flex w={{ base: '100%', md: 'auto' }}>
            <IconButton
              variant="danger"
              ref={removeOrgBtnRef}
              onClick={onRemovalOpen}
              p={2}
              m={0}
              w={{ base: '45%', md: 'auto' }}
              aria-label={t`Remove Organization`}
              icon={<MinusIcon />}
            />
            <IconButton
              variant="primary"
              p={2}
              m={0}
              ml={{ base: 'auto', md: 2 }}
              onClick={() => setIsEditingOrg(!isEditingOrg)}
              w={{ base: '45%', md: 'auto' }}
              aria-label={t`Edit Organization`}
              icon={<EditIcon />}
            />
            {!isLoginRequired && (
              <Button
                variant="danger"
                order={{ base: 1, md: 2 }}
                onClick={() => {
                  leaveOrgOnOpen()
                }}
                flexShrink={0}
                ml="2"
              >
                <Trans> Leave Organization </Trans>
              </Button>
            )}
          </Flex>
        </Flex>

        <Collapse in={isEditingOrg}>
          <Formik
            validateOnBlur={false}
            initialValues={{
              acronymEN: '',
              acronymFR: '',
              nameEN: '',
              nameFR: '',
              zoneEN: '',
              zoneFR: '',
              sectorEN: '',
              sectorFR: '',
              countryEN: '',
              countryFR: '',
              provinceEN: '',
              provinceFR: '',
              cityEN: '',
              cityFR: '',
            }}
            validationSchema={updateOrgValidationSchema}
            onSubmit={async (values, formikHelpers) => {
              // Update the organization (only include fields that have values)
              const propertiesWithValues = {}

              // Extract only the entries that have truthy values
              Object.entries(values).forEach((entry) => {
                const [key, value] = entry
                if (value) {
                  propertiesWithValues[key] = value
                }
              })

              // Handle case where user does not supply any fields to update
              if (Object.keys(propertiesWithValues).length === 0) {
                toast({
                  title: t`Organization not updated`,
                  description: t`No values were supplied when attempting to update organization details.`,
                  status: 'warning',
                  duration: 9000,
                  isClosable: true,
                  position: 'top-left',
                })

                return
              }

              const updateResponse = await updateOrganization({
                variables: {
                  id: org.id,
                  ...propertiesWithValues,
                },
              })

              // Close and reset form if successfully updated organization
              if (
                updateResponse.data.updateOrganization.result.__typename ===
                'Organization'
              ) {
                setIsEditingOrg(false)
                formikHelpers.resetForm()
              }
            }}
          >
            {({ handleSubmit, handleReset }) => (
              <form onSubmit={handleSubmit}>
                <Grid
                  gridTemplateColumns="repeat(4, 1fr)"
                  gridRowGap="0.5rem"
                  gridColumnGap="1.5rem"
                  mx="1rem"
                  mb="1.5rem"
                >
                  <Text
                    fontWeight="bold"
                    textAlign="center"
                    mb="0.5em"
                    gridColumn="span 4"
                  >
                    <Trans>
                      Blank fields will not be included when updating the
                      organization.
                    </Trans>
                  </Text>
                  <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
                    <FormField name="acronymEN" label={t`Acronym (EN)`} />
                  </Box>
                  <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
                    <FormField name="acronymFR" label={t`Acronym (FR)`} />
                  </Box>
                  <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
                    <FormField name="nameEN" label={t`Name (EN)`} />
                  </Box>
                  <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
                    <FormField name="nameFR" label={t`Name (FR)`} />
                  </Box>
                  <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
                    <FormField name="countryEN" label={t`Country (EN)`} />
                  </Box>
                  <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
                    <FormField name="countryFR" label={t`Country (FR)`} />
                  </Box>
                  <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
                    <FormField name="provinceEN" label={t`Province (EN)`} />
                  </Box>
                  <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
                    <FormField name="provinceFR" label={t`Province (FR)`} />
                  </Box>
                  <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
                    <FormField name="cityEN" label={t`City (EN)`} />
                  </Box>
                  <Box
                    gridColumn={{ base: 'span 4', md: 'span 2' }}
                    mb="0.5rem"
                  >
                    <FormField name="cityFR" label={t`City (FR)`} />
                  </Box>
                  <Button
                    variant="danger"
                    type="reset"
                    onClick={handleReset}
                    gridColumn={{ base: '1 / 3', md: '1 / 2' }}
                    isLoading={updateOrgLoading}
                  >
                    <Trans>Clear</Trans>
                  </Button>
                  <Button
                    variant="primaryOutline"
                    type="button"
                    onClick={() => setIsEditingOrg(false)}
                    gridColumn={{ base: '3 / 5', md: '3 / 4' }}
                    isLoading={updateOrgLoading}
                  >
                    <Trans>Close</Trans>
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    gridColumn={{ base: '1 / 5', md: '4 / 5' }}
                    isLoading={updateOrgLoading}
                  >
                    <Trans>Confirm</Trans>
                  </Button>
                </Grid>
              </form>
            )}
          </Formik>
        </Collapse>

        <Grid
          gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
          gridRowGap="0.5em"
          mx="1rem"
        >
          <Text fontWeight="bold">
            <Trans>Slug:</Trans>{' '}
            <Box as="span" fontWeight="normal">
              {org.slug}
            </Box>
          </Text>
          <Text fontWeight="bold">
            <Trans>Acronym:</Trans>{' '}
            <Box as="span" fontWeight="normal">
              {org.acronym}
            </Box>
          </Text>

          {org.zone && (
            <Text fontWeight="bold">
              <Trans>Zone:</Trans>{' '}
              <Box as="span" fontWeight="normal">
                {org.zone}
              </Box>
            </Text>
          )}
          {org.sector && (
            <Text fontWeight="bold">
              <Trans>Sector:</Trans>{' '}
              <Box as="span" fontWeight="normal">
                {org.sector}
              </Box>
            </Text>
          )}

          <Text fontWeight="bold">
            <Trans>City:</Trans>{' '}
            <Box as="span" fontWeight="normal">
              {org.city}
            </Box>
          </Text>
          <Text fontWeight="bold">
            <Trans>Province:</Trans>{' '}
            <Box as="span" fontWeight="normal">
              {org.province}
            </Box>
          </Text>

          <Text fontWeight="bold">
            <Trans>Country:</Trans>{' '}
            <Box as="span" fontWeight="normal">
              {org.country}
            </Box>
          </Text>
        </Grid>
      </Box>

      <Modal
        finalFocusRef={removeOrgBtnRef}
        isOpen={isRemovalOpen}
        onClose={onRemovalClose}
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <Formik
          validateOnBlur={false}
          initialValues={{
            orgName: '',
          }}
          initialTouched={{
            orgName: true,
          }}
          validationSchema={removeOrgValidationSchema}
          onSubmit={async () => {
            // Submit the remove organization mutation
            await removeOrganization({
              variables: {
                orgId: org.id,
              },
            })
          }}
        >
          {({ handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <ModalContent>
                <ModalHeader>
                  <Trans>Remove Organization</Trans>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Text>
                    <Trans>
                      Are you sure you want to permanently remove the
                      organization "{org.name}"?
                    </Trans>
                  </Text>

                  <br />

                  <Text mb="1rem">
                    <Trans>
                      Enter "{org.name}" below to confirm removal. This field is
                      case-sensitive.
                    </Trans>
                  </Text>

                  <FormField
                    name="orgName"
                    label={t`Organization Name`}
                    placeholder={org.name}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant="primary"
                    isLoading={removeOrgLoading}
                    type="submit"
                    mr="4"
                  >
                    <Trans>Confirm</Trans>
                  </Button>
                </ModalFooter>
              </ModalContent>
            </form>
          )}
        </Formik>
      </Modal>

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
              Are you sure you wish to leave {org.name}? You will have to be
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
                    orgId: org.id,
                  },
                })
              }}
              isLoading={loadingLeaveOrg}
            >
              <Trans>Confirm</Trans>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

OrganizationInformation.propTypes = {
  orgSlug: string.isRequired,
  removeOrgCallback: func.isRequired,
  isLoginRequired: bool,
}
