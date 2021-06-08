import React from 'react'
import { Stack, useToast, Box, Heading } from '@chakra-ui/core'
import { Trans, t } from '@lingui/macro'
import { CREATE_ORGANIZATION } from './graphql/mutations'
import { useMutation } from '@apollo/client'
import { useUserState } from './UserState'
import { LoadingMessage } from './LoadingMessage'
import { Formik } from 'formik'
import { useHistory, Link as RouteLink } from 'react-router-dom'
import { TrackerButton } from './TrackerButton'
import { object, string } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import CreateOrganizationField from './CreateOrganizationField'
import { i18n } from '@lingui/core'

export default function CreateOrganizationPage() {
  const { currentUser } = useUserState()
  const toast = useToast()
  const history = useHistory()

  const validationSchema = object().shape({
    nameEN: string().required(i18n._(fieldRequirements.field.required.message)),
    nameFR: string().required(i18n._(fieldRequirements.field.required.message)),
    acronymEN: string()
      .matches(
        fieldRequirements.acronym.matches.regex,
        i18n._(fieldRequirements.acronym.matches.message),
      )
      .max(
        fieldRequirements.acronym.max.maxLength,
        i18n._(fieldRequirements.acronym.max.message),
      )
      .required(i18n._(fieldRequirements.field.required.message)),
    acronymFR: string()
      .matches(
        fieldRequirements.acronym.matches.regex,
        i18n._(fieldRequirements.acronym.matches.message),
      )
      .max(
        fieldRequirements.acronym.max.maxLength,
        i18n._(fieldRequirements.acronym.max.message),
      )
      .required(i18n._(fieldRequirements.field.required.message)),
    zoneEN: string().required(i18n._(fieldRequirements.field.required.message)),
    zoneFR: string().required(i18n._(fieldRequirements.field.required.message)),
    sectorEN: string().required(
      i18n._(fieldRequirements.field.required.message),
    ),
    sectorFR: string().required(
      i18n._(fieldRequirements.field.required.message),
    ),
    cityEN: string().required(i18n._(fieldRequirements.field.required.message)),
    cityFR: string().required(i18n._(fieldRequirements.field.required.message)),
    provinceEN: string().required(
      i18n._(fieldRequirements.field.required.message),
    ),
    provinceFR: string().required(
      i18n._(fieldRequirements.field.required.message),
    ),
    countryEN: string().required(
      i18n._(fieldRequirements.field.required.message),
    ),
    countryFR: string().required(
      i18n._(fieldRequirements.field.required.message),
    ),
  })

  const [createOrganization, { loading }] = useMutation(CREATE_ORGANIZATION, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
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
    onCompleted({ createOrganization }) {
      if (createOrganization.result.__typename === 'Organization') {
        toast({
          title: t`Organization created`,
          description: t`${createOrganization.result.name} was created`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        history.push('/admin')
      } else if (createOrganization.result.__typename === 'OrganizationError') {
        toast({
          title: t`Unable to create new organization.`,
          description: createOrganization.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect createOrganization.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect createOrganization.result typename.')
      }
    },
  })

  if (loading) return <LoadingMessage />

  return (
    <Box px="4" mx="auto" overflow="hidden">
      <Formik
        validationSchema={validationSchema}
        initialValues={{
          nameEN: '',
          nameFR: '',
          acronymEN: '',
          acronymFR: '',
          zoneEN: '',
          zoneFR: '',
          sectorEN: '',
          sectorFR: '',
          cityEN: '',
          cityFR: '',
          provinceEN: '',
          provinceFR: '',
          countryEN: '',
          countryFR: '',
        }}
        onSubmit={async (values) => {
          createOrganization({
            variables: {
              nameEN: values.nameEN,
              nameFR: values.nameFR,
              acronymEN: values.acronymEN,
              acronymFR: values.acronymFR,
              zoneEN: values.zoneEN,
              zoneFR: values.zoneFR,
              sectorEN: values.sectorEN,
              sectorFR: values.sectorFR,
              countryEN: values.countryEN,
              countryFR: values.countryFR,
              provinceEN: values.provinceEN,
              provinceFR: values.provinceFR,
              cityEN: values.cityEN,
              cityFR: values.cityFR,
            },
          })
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form id="form" onSubmit={handleSubmit}>
            <Heading as="h1" fontSize="2xl" mb="6" textAlign="center">
              <Trans>
                Create an organization by filling out the following info in both
                English and French
              </Trans>
            </Heading>

            <Stack mb="4">
              <CreateOrganizationField
                name="nameEN"
                language={t`English`}
                label={t`Name`}
              />
              <CreateOrganizationField
                name="nameFR"
                language={t`French`}
                label={t`Name`}
              />
            </Stack>

            <Stack mb="4">
              <CreateOrganizationField
                name="acronymEN"
                language={t`English`}
                label={t`Acronym`}
              />
              <CreateOrganizationField
                name="acronymFR"
                language={t`French`}
                label={t`Acronym`}
              />
            </Stack>

            <Stack mb="4">
              <CreateOrganizationField
                name="zoneEN"
                language={t`English`}
                label={t`Zone`}
              />
              <CreateOrganizationField
                name="zoneFR"
                language={t`French`}
                label={t`Zone`}
              />
            </Stack>

            <Stack mb="4">
              <CreateOrganizationField
                name="sectorEN"
                language={t`English`}
                label={t`Sector`}
              />
              <CreateOrganizationField
                name="sectorFR"
                language={t`French`}
                label={t`Sector`}
              />
            </Stack>

            <Stack mb="4">
              <CreateOrganizationField
                name="cityEN"
                language={t`English`}
                label={t`City`}
              />
              <CreateOrganizationField
                name="cityFR"
                language={t`French`}
                label={t`City`}
              />
            </Stack>

            <Stack mb="4">
              <CreateOrganizationField
                name="provinceEN"
                language={t`English`}
                label={t`Province`}
              />
              <CreateOrganizationField
                name="provinceFR"
                language={t`French`}
                label={t`Province`}
              />
            </Stack>

            <Stack mb="4">
              <CreateOrganizationField
                name="countryEN"
                language={t`English`}
                label={t`Country`}
              />
              <CreateOrganizationField
                name="countryFR"
                language={t`French`}
                label={t`Country`}
              />
            </Stack>

            <Stack spacing={4} isInline justifyContent="space-between" mb="4">
              <TrackerButton
                as={RouteLink}
                variant="primary outline"
                to="/admin"
              >
                <Trans>Back</Trans>
              </TrackerButton>

              <TrackerButton
                type="submit"
                id="submitBtn"
                isLoading={isSubmitting}
                variant="primary"
              >
                <Trans>Create Organization</Trans>
              </TrackerButton>
            </Stack>
          </form>
        )}
      </Formik>
    </Box>
  )
}
