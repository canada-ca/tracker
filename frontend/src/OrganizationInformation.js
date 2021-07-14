import React, { useRef, useState } from 'react'
import {
  Box,
  Collapse,
  Grid,
  Heading,
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
  VisuallyHidden,
} from '@chakra-ui/react'
import { CheckCircleIcon, MinusIcon, EditIcon } from '@chakra-ui/icons'
import { func, string } from 'prop-types'
import { useMutation, useQuery } from '@apollo/client'
import { ORGANIZATION_INFORMATION } from './graphql/queries'
import { LoadingMessage } from './LoadingMessage'
import { t, Trans } from '@lingui/macro'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { TrackerButton } from './TrackerButton'
import { object, string as yupString } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import FormField from './FormField'
import { useLingui } from '@lingui/react'
import { Formik } from 'formik'
import { REMOVE_ORGANIZATION, UPDATE_ORGANIZATION } from './graphql/mutations'

export default function OrganizationInformation({
  orgSlug,
  removeOrgCallback: setSelectedOrg,
  ...props
}) {
  const toast = useToast()
  const {
    isOpen: isRemovalOpen,
    onOpen: onRemovalOpen,
    onClose: onRemovalClose,
  } = useDisclosure()
  const removeOrgBtnRef = useRef()
  const { i18n } = useLingui()
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

  const updateOrgValidationSchema = object().shape({
    acronymEN: yupString().matches(
      fieldRequirements.acronym.matches.regex,
      i18n._(fieldRequirements.acronym.matches.message),
    ),
    acronymFR: yupString().matches(
      fieldRequirements.acronym.matches.regex,
      i18n._(fieldRequirements.acronym.matches.message),
    ),
  })

  const removeOrgValidationSchema = object().shape({
    orgName: yupString()
      .required(i18n._(fieldRequirements.field.required.message))
      .matches(org.name, t`Organization name does not match.`),
  })

  return (
    <>
      <Box {...props}>
        <Stack isInline align="center" mb="1em" flexWrap="wrap">
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
                <CheckCircleIcon color="blue.500" size="icons.md" />
              )}
            </Heading>
          </Stack>

          <Stack
            flexGrow={{ base: '1', md: '0' }}
            isInline
            justifyContent="space-evenly"
          >
            <TrackerButton
              ref={removeOrgBtnRef}
              onClick={onRemovalOpen}
              variant="danger"
              px="2"
              mr={{ md: '0.5em' }}
              w={{ base: '45%', md: 'auto' }}
            >
              <Stack spacing={0}>
                <MinusIcon />
                <VisuallyHidden>
                  <Trans>Remove Organization</Trans>
                </VisuallyHidden>
              </Stack>
            </TrackerButton>
            <TrackerButton
              variant="primary"
              px="2"
              onClick={() => setIsEditingOrg(!isEditingOrg)}
              w={{ base: '45%', md: 'auto' }}
            >
              <Stack spacing={0}>
                <EditIcon />
                <VisuallyHidden>
                  <Trans>Edit Organization</Trans>
                </VisuallyHidden>
              </Stack>
            </TrackerButton>
          </Stack>
        </Stack>

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
                    <FormField name="zoneEN" label={t`Zone (EN)`} />
                  </Box>
                  <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
                    <FormField name="zoneFR" label={t`Zone (FR)`} />
                  </Box>
                  <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
                    <FormField name="sectorEN" label={t`Sector (EN)`} />
                  </Box>
                  <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
                    <FormField name="sectorFR" label={t`Sector (FR)`} />
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
                  <TrackerButton
                    type="reset"
                    variant="danger"
                    onClick={handleReset}
                    gridColumn={{ base: '1 / 3', md: '1 / 2' }}
                    isLoading={updateOrgLoading}
                  >
                    <Trans>Clear</Trans>
                  </TrackerButton>
                  <TrackerButton
                    type="button"
                    variant="primary outline"
                    onClick={() => setIsEditingOrg(false)}
                    gridColumn={{ base: '3 / 5', md: '3 / 4' }}
                    isLoading={updateOrgLoading}
                  >
                    <Trans>Close</Trans>
                  </TrackerButton>
                  <TrackerButton
                    type="submit"
                    variant="primary"
                    gridColumn={{ base: '1 / 5', md: '4 / 5' }}
                    isLoading={updateOrgLoading}
                  >
                    <Trans>Confirm</Trans>
                  </TrackerButton>
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

          <Text fontWeight="bold">
            <Trans>Zone:</Trans>{' '}
            <Box as="span" fontWeight="normal">
              {org.zone}
            </Box>
          </Text>
          <Text fontWeight="bold">
            <Trans>Sector:</Trans>{' '}
            <Box as="span" fontWeight="normal">
              {org.sector}
            </Box>
          </Text>

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
                  <TrackerButton
                    isLoading={removeOrgLoading}
                    type="submit"
                    mr="4"
                    variant="primary"
                  >
                    <Trans>Confirm</Trans>
                  </TrackerButton>
                </ModalFooter>
              </ModalContent>
            </form>
          )}
        </Formik>
      </Modal>
    </>
  )
}

OrganizationInformation.propTypes = {
  orgSlug: string.isRequired,
  removeOrgCallback: func.isRequired,
}
