import React, { useState } from 'react'
import {
  Box,
  Button,
  Flex,
  SimpleGrid,
  Heading,
  Stack,
  useToast,
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { CREATE_ORGANIZATION } from './graphql/mutations'
import { useMutation } from '@apollo/client'
import { LoadingMessage } from './LoadingMessage'
import { Formik } from 'formik'
import { Link as RouteLink, useHistory } from 'react-router-dom'
import { object, string } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import CreateOrganizationField from './CreateOrganizationField'
import { i18n } from '@lingui/core'
import { InfoButton, InfoBox, InfoPanel } from './InfoPanel'

export default function CreateOrganizationPage() {
  const toast = useToast()
  const history = useHistory()

  const [infoState, changeInfoState] = useState({
    isVisible: false,
  })

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
    <Box px="4" mx="auto" overflow="hidden" w="100%">
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
              zoneEN: '',
              zoneFR: '',
              sectorEN: '',
              sectorFR: '',
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
            <Flex>
              <Heading as="h1" fontSize="2xl" textAlign="center">
                <Trans>Create an organization</Trans>
              </Heading>
              <InfoButton
                label="Glossary"
                state={infoState}
                changeState={changeInfoState}
                ml="auto"
                display="block"
              />
            </Flex>

            <InfoPanel state={infoState}>
              <InfoBox title="Name" info="The name of the Organization." />
              <InfoBox
                title="Acronym"
                info="The acronym of the Organization."
              />
              <InfoBox
                title="City"
                info="The city the Organization is based in."
              />
              <InfoBox
                title="Province"
                info="The province the Organization is based in."
              />
              <InfoBox
                title="Country"
                info="The country the Organization is based in."
              />
            </InfoPanel>

            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              spacing={{ base: 2, lg: 4 }}
              mt="4"
            >
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
            </SimpleGrid>

            <Stack spacing={4} isInline justifyContent="space-between" my="6">
              <Button variant="primaryOutline" as={RouteLink} to="/admin">
                <Trans>Back</Trans>
              </Button>

              <Button
                variant="primary"
                type="submit"
                id="submitBtn"
                isLoading={isSubmitting}
              >
                <Trans>Create Organization</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Box>
  )
}
