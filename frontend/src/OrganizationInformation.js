import React, { useRef, useState } from 'react'
import {
  Box,
  Collapse,
  Flex,
  Grid,
  Heading,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SlideIn,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/core'
import { string } from 'prop-types'
import { useMutation, useQuery } from '@apollo/client'
import { ORGANIZATION_INFORMATION } from './graphql/queries'
import { useUserState } from './UserState'
import { LoadingMessage } from './LoadingMessage'
import { t, Trans } from '@lingui/macro'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { TrackerButton } from './TrackerButton'
import { object, string as yupString } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import FormField from './FormField'
import { useLingui } from '@lingui/react'
import { Formik } from 'formik'
import { REMOVE_ORGANIZATION, UPDATE_USER_PASSWORD } from './graphql/mutations'

export default function OrganizationInformation({ orgSlug, ...props }) {
  const { currentUser } = useUserState()
  const toast = useToast()
  const {
    isOpen: isRemovalOpen,
    onOpen: onRemovalOpen,
    onClose: onRemovalClose,
  } = useDisclosure()
  const removeOrgBtnRef = useRef()
  const removeOrgInputRef = useRef()
  const { i18n } = useLingui()
  const [isEditingOrg, setIsEditingOrg] = useState(false)

  const { loading, error, data } = useQuery(ORGANIZATION_INFORMATION, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
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

  const [removeOrganization, { error: _removeOrganizationError }] = useMutation(
    REMOVE_ORGANIZATION,
    {
      context: {
        headers: {
          authorization: currentUser.jwt,
        },
      },
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
        if (removeOrganization.result.__typename === 'OrganizationResult') {
          toast({
            title: t`Removed Organization`,
            description: t`You have successfully removed ${removeOrganization.result.organization.name}.`,
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          onRemovalClose()
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
    nameEN: yupString(),
    nameFR: yupString(),
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
            flexBasis={{ base: '100%', md: 'auto' }}
            mb={{ base: '0.5em', md: '0' }}
          >
            <Heading as="h1" fontSize="3xl">
              {org.name}
            </Heading>
            <Icon name="check-circle" color="blue.500" size="icons.md" />
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
              <Icon name="minus" />
            </TrackerButton>
            <TrackerButton
              variant="primary"
              px="2"
              onClick={() => setIsEditingOrg(!isEditingOrg)}
              w={{ base: '45%', md: 'auto' }}
            >
              <Icon name="edit" />
            </TrackerButton>
          </Stack>
        </Stack>

        <Collapse isOpen={isEditingOrg}>
          <Formik
            validateOnBlur={false}
            initialValues={{
              acronymEN: '',
              acronymFR: '',
              nameEN: '',
              nameFR: '',
            }}
            validationSchema={updateOrgValidationSchema}
            onSubmit={async () => {
              // // Submit the remove organization mutation
              // await removeOrganization({
              //   variables: {
              //     orgId: org.id,
              //   },
              // })
            }}
          >
            {({ handleSubmit, isSubmitting }) => (
              <form onSubmit={handleSubmit}>
                <Grid
                  gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
                  gridRowGap="0.5em"
                  gridColumnGap="1.5em"
                  mx="1rem"
                >
                  <FormField
                    name="acronymEN"
                    label={t`Acronym (EN)`}
                    // placeholder={org.name}
                  />
                  <FormField
                    name="acronymFR"
                    label={t`Acronym (FR)`}
                    // placeholder={org.name}
                  />
                  <FormField
                    name="nameEN"
                    label={t`Name (EN)`}
                    // placeholder={org.name}
                  />
                  <FormField
                    name="nameFR"
                    label={t`Name (FR)`}
                    // placeholder={org.name}
                  />{' '}
                  <FormField
                    name="acronymEN"
                    label={t`Acronym (EN)`}
                    // placeholder={org.name}
                  />
                  <FormField
                    name="acronymFR"
                    label={t`Acronym (FR)`}
                    // placeholder={org.name}
                  />
                  <FormField
                    name="nameEN"
                    label={t`Name (EN)`}
                    // placeholder={org.name}
                  />
                  <FormField
                    name="nameFR"
                    label={t`Name (FR)`}
                    // placeholder={org.name}
                  />{' '}
                  <FormField
                    name="acronymEN"
                    label={t`Acronym (EN)`}
                    // placeholder={org.name}
                  />
                  <FormField
                    name="acronymFR"
                    label={t`Acronym (FR)`}
                    // placeholder={org.name}
                  />
                  <FormField
                    name="nameEN"
                    label={t`Name (EN)`}
                    // placeholder={org.name}
                  />
                  <FormField
                    name="nameFR"
                    label={t`Name (FR)`}
                    // placeholder={org.name}
                  />{' '}
                  <FormField
                    name="acronymEN"
                    label={t`Acronym (EN)`}
                    // placeholder={org.name}
                  />
                  <FormField
                    name="acronymFR"
                    label={t`Acronym (FR)`}
                    // placeholder={org.name}
                  />
                  <FormField
                    name="nameEN"
                    label={t`Name (EN)`}
                    // placeholder={org.name}
                  />
                  <FormField
                    name="nameFR"
                    label={t`Name (FR)`}
                    // placeholder={org.name}
                  />
                  <TrackerButton
                    isLoading={isSubmitting}
                    mr="4"
                    variant="primary"
                    onClick={() => setIsEditingOrg(false)}
                    justifySelf="end"
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
            Slug:{' '}
            <Box as="span" fontWeight="normal">
              {org.slug}
            </Box>
          </Text>
          <Text fontWeight="bold">
            Acronym:{' '}
            <Box as="span" fontWeight="normal">
              {org.acronym}
            </Box>
          </Text>

          <Text fontWeight="bold">
            Zone:{' '}
            <Box as="span" fontWeight="normal">
              {org.zone}
            </Box>
          </Text>
          <Text fontWeight="bold">
            Sector:{' '}
            <Box as="span" fontWeight="normal">
              {org.sector}
            </Box>
          </Text>

          <Text fontWeight="bold">
            City:{' '}
            <Box as="span" fontWeight="normal">
              {org.city}
            </Box>
          </Text>
          <Text fontWeight="bold">
            Province:{' '}
            <Box as="span" fontWeight="normal">
              {org.province}
            </Box>
          </Text>

          <Text fontWeight="bold">
            Country:{' '}
            <Box as="span" fontWeight="normal">
              {org.country}
            </Box>
          </Text>
        </Grid>
      </Box>

      <SlideIn in={isRemovalOpen}>
        {(styles) => (
          <Modal
            finalFocusRef={removeOrgBtnRef}
            isOpen={true}
            onClose={onRemovalClose}
          >
            <ModalOverlay opacity={styles.opacity} />
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
              {({ handleSubmit, isSubmitting }) => (
                <form onSubmit={handleSubmit}>
                  <ModalContent {...styles}>
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
                          Enter "{org.name}" below to confirm removal. This
                          field is case-sensitive.
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
                        isLoading={isSubmitting}
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
        )}
      </SlideIn>

      {/*<SlideIn in={isRemovalOpen}>*/}
      {/*  {(styles) => (*/}
      {/*    <Modal*/}
      {/*      finalFocusRef={removeOrgBtnRef}*/}
      {/*      isOpen={true}*/}
      {/*      onClose={onRemovalClose}*/}
      {/*    >*/}
      {/*      <ModalOverlay opacity={styles.opacity} />*/}
      {/*      <Formik*/}
      {/*        validateOnBlur={false}*/}
      {/*        initialValues={{*/}
      {/*          orgName: '',*/}
      {/*        }}*/}
      {/*        initialTouched={{*/}
      {/*          orgName: true,*/}
      {/*        }}*/}
      {/*        validationSchema={removeOrgValidationSchema}*/}
      {/*        onSubmit={async () => {*/}
      {/*          // Submit the remove organization mutation*/}
      {/*          await removeOrganization({*/}
      {/*            variables: {*/}
      {/*              orgId: org.id,*/}
      {/*            },*/}
      {/*          })*/}
      {/*        }}*/}
      {/*      >*/}
      {/*        {({ handleSubmit, isSubmitting }) => (*/}
      {/*          <form onSubmit={handleSubmit}>*/}
      {/*            <ModalContent {...styles}>*/}
      {/*              <ModalHeader>*/}
      {/*                <Trans>Remove Organization</Trans>*/}
      {/*              </ModalHeader>*/}
      {/*              <ModalCloseButton />*/}
      {/*              <ModalBody>*/}
      {/*                <Text>*/}
      {/*                  <Trans>*/}
      {/*                    Are you sure you want to permanently remove the*/}
      {/*                    organization "{org.name}"?*/}
      {/*                  </Trans>*/}
      {/*                </Text>*/}

      {/*                <br />*/}

      {/*                <Text mb="1rem">*/}
      {/*                  <Trans>*/}
      {/*                    Enter "{org.name}" below to confirm removal. This*/}
      {/*                    field is case-sensitive.*/}
      {/*                  </Trans>*/}
      {/*                </Text>*/}

      {/*                <FormField*/}
      {/*                  name="orgName"*/}
      {/*                  label={t`Organization Name`}*/}
      {/*                  placeholder={org.name}*/}
      {/*                />*/}
      {/*              </ModalBody>*/}
      {/*              <ModalFooter>*/}
      {/*                <TrackerButton*/}
      {/*                  isLoading={isSubmitting}*/}
      {/*                  type="submit"*/}
      {/*                  mr="4"*/}
      {/*                  variant="primary"*/}
      {/*                >*/}
      {/*                  <Trans>Confirm</Trans>*/}
      {/*                </TrackerButton>*/}
      {/*              </ModalFooter>*/}
      {/*            </ModalContent>*/}
      {/*          </form>*/}
      {/*        )}*/}
      {/*      </Formik>*/}
      {/*    </Modal>*/}
      {/*  )}*/}
      {/*</SlideIn>*/}
    </>
  )
}

OrganizationInformation.propTypes = {
  orgSlug: string.isRequired,
}
