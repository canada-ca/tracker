import React from 'react'
import { Box, Button, Flex, SimpleGrid, Heading, Stack, useToast, Switch, Badge } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { useMutation } from '@apollo/client'
import { Formik } from 'formik'
import { Link as RouteLink, useNavigate } from 'react-router-dom'
import { useLingui } from '@lingui/react'

import { CreateOrganizationField } from '../components/fields/CreateOrganizationField'

import { LoadingMessage } from '../components/LoadingMessage'
import { getRequirement, schemaToValidation } from '../utilities/fieldRequirements'
import { CREATE_ORGANIZATION } from '../graphql/mutations'
import { FormField } from '../components/fields/FormField'
import { CheckCircleIcon } from '@chakra-ui/icons'
import withSuperAdmin from '../app/withSuperAdmin'

export default function CreateOrganizationPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const { i18n } = useLingui()

  const fieldRequirement = getRequirement('field')
  const acronymRequirement = getRequirement('acronym').required(i18n._(t`This field cannot be empty`))

  const validationSchema = schemaToValidation({
    nameEN: fieldRequirement,
    nameFR: fieldRequirement,
    acronymEN: acronymRequirement,
    acronymFR: acronymRequirement,
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
          externalId: '',
          verified: false,
        }}
        onSubmit={async (values) => {
          createOrganization({
            variables: {
              nameEN: values.nameEN,
              nameFR: values.nameFR,
              acronymEN: values.acronymEN,
              acronymFR: values.acronymFR,
              externalId: values.externalId,
              verified: values.verified,
            },
          })
        }}
      >
        {({ handleSubmit, isSubmitting, handleChange }) => (
          <form id="form" onSubmit={handleSubmit}>
            <Flex>
              <Heading as="h1" fontSize="2xl" textAlign="center">
                <Trans>Create an organization</Trans>
              </Heading>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 2, lg: 4 }} mt="4">
              <CreateOrganizationField name="nameEN" language={t`English`} label={t`Name`} />
              <CreateOrganizationField name="nameFR" language={t`French`} label={t`Name`} />

              <CreateOrganizationField name="acronymEN" language={t`English`} label={t`Acronym`} />
              <CreateOrganizationField name="acronymFR" language={t`French`} label={t`Acronym`} />

              <FormField name="externalId" label={t`External ID`} />
              <VerifiedSwitch handleChange={handleChange} />
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
    </Box>
  )
}

const VerifiedSwitch = withSuperAdmin(({ handleChange }) => {
  return (
    <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
      <Flex p="1" align="center">
        <Switch isFocusable={true} id="verified" name="verified" aria-label="verified" mx="2" onChange={handleChange} />
        <Badge variant="outline" color="gray.900" p="1.5">
          <Flex align="center">
            <Trans>Verified</Trans>
            <CheckCircleIcon color="blue.500" boxSize="icons.sm" ml="1" />
          </Flex>
        </Badge>
      </Flex>
    </Box>
  )
})
