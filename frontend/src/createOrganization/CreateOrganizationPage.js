import React from 'react'
import { Box, Button, Flex, SimpleGrid, Heading, Stack, useToast, useDisclosure } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { useMutation } from '@apollo/client'
import { Formik } from 'formik'
import { Link as RouteLink, useNavigate } from 'react-router-dom'
import { useLingui } from '@lingui/react'

import { CreateOrganizationField } from '../components/fields/CreateOrganizationField'

import { InfoButton, InfoBox, InfoPanel } from '../components/InfoPanel'
import { LoadingMessage } from '../components/LoadingMessage'
import { getRequirement, schemaToValidation } from '../utilities/fieldRequirements'
import { CREATE_ORGANIZATION } from '../graphql/mutations'

export default function CreateOrganizationPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const { i18n } = useLingui()

  const { isOpen, onToggle } = useDisclosure()

  const fieldRequirement = getRequirement('field')
  const acronymRequirement = getRequirement('acronym').required(i18n._(t`This field cannot be empty`))

  const validationSchema = schemaToValidation({
    nameEN: fieldRequirement,
    nameFR: fieldRequirement,
    acronymEN: acronymRequirement,
    acronymFR: acronymRequirement,
    cityEN: fieldRequirement,
    cityFR: fieldRequirement,
    provinceEN: fieldRequirement,
    provinceFR: fieldRequirement,
    countryEN: fieldRequirement,
    countryFR: fieldRequirement,
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
        navigate('/admin')
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
            </Flex>

            <InfoPanel isOpen={isOpen} onToggle={onToggle}>
              <InfoBox title="Name" info="The name of the Organization." />
              <InfoBox title="Acronym" info="The acronym of the Organization." />
              <InfoBox title="City" info="The city the Organization is based in." />
              <InfoBox title="Province" info="The province the Organization is based in." />
              <InfoBox title="Country" info="The country the Organization is based in." />
            </InfoPanel>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 2, lg: 4 }} mt="4">
              <CreateOrganizationField name="nameEN" language={t`English`} label={t`Name`} />
              <CreateOrganizationField name="nameFR" language={t`French`} label={t`Name`} />

              <CreateOrganizationField name="acronymEN" language={t`English`} label={t`Acronym`} />
              <CreateOrganizationField name="acronymFR" language={t`French`} label={t`Acronym`} />

              <CreateOrganizationField name="cityEN" language={t`English`} label={t`City`} />
              <CreateOrganizationField name="cityFR" language={t`French`} label={t`City`} />

              <CreateOrganizationField name="provinceEN" language={t`English`} label={t`Province`} />
              <CreateOrganizationField name="provinceFR" language={t`French`} label={t`Province`} />

              <CreateOrganizationField name="countryEN" language={t`English`} label={t`Country`} />
              <CreateOrganizationField name="countryFR" language={t`French`} label={t`Country`} />
            </SimpleGrid>

            <Stack spacing={4} isInline justifyContent="space-between" my="6">
              <Button variant="primaryOutline" as={RouteLink} to="/admin">
                <Trans>Back</Trans>
              </Button>

              <Button variant="primary" type="submit" id="submitBtn" isLoading={isSubmitting}>
                <Trans>Create Organization</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
      <InfoButton isOpen={isOpen} onToggle={onToggle} left="50%" />
    </Box>
  )
}
