import React from 'react'
import {
  Stack,
  useToast,
  Box,
  Button,
  Heading,
  Input,
  Text,
  FormControl,
  FormErrorMessage,
} from '@chakra-ui/core'
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
import AcronymField from './AcronymField'
import { i18n } from '@lingui/core'

export default function CreateOrganizationPage() {
  const { currentUser } = useUserState()
  const toast = useToast()
  const history = useHistory()

  const validationSchema = object().shape({
    acronymEN: string()
      .matches(
        fieldRequirements.acronym.matches.regex,
        i18n._(fieldRequirements.acronym.matches.message),
      )
      .max(
        fieldRequirements.acronym.max.maxLength,
        i18n._(fieldRequirements.acronym.max.message),
      ),
    acronymFR: string()
      .matches(
        fieldRequirements.acronym.matches.regex,
        i18n._(fieldRequirements.acronym.matches.message),
      )
      .max(
        fieldRequirements.acronym.max.maxLength,
        i18n._(fieldRequirements.acronym.max.message),
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
          description: t`${createOrganization.result.slug} was created`,
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
          nameEN: 'a',
          nameFR: 'a',
          acronymEN: '',
          acronymFR: '',
          zoneEN: 'a',
          zoneFR: 'a',
          sectorEN: 'a',
          sectorFR: 'a',
          cityEN: 'a',
          cityFR: 'a',
          provinceEN: 'a',
          provinceFR: 'a',
          countryEN: 'a',
          countryFR: 'a',
        }}
        onSubmit={async (values) => {
          createOrganization({
            variables: {
              acronymEN: values.acronymEN,
              acronymFR: values.acronymFR,
              nameEN: values.nameEN,
              nameFR: values.nameFR,
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
        {({ handleSubmit, handleChange, values, isSubmitting }) => (
          <form id="form" onSubmit={handleSubmit}>
            <Heading as="h1" fontSize="2xl" mb="6" textAlign="center">
              <Trans>
                Create an organization by filling out the following info in both
                English and French
              </Trans>
            </Heading>

            <Stack mb="4">
              <Text fontSize="lg" fontWeight="bold">
                <Trans>Name:</Trans>
              </Text>
              <FormControl isRequired>
                <Input
                  id="nameEN"
                  name="nameEN"
                  onChange={handleChange}
                  value={values.nameEN}
                  placeholder={t`Name EN`}
                />
                <FormErrorMessage>Error!</FormErrorMessage>
              </FormControl>
              <FormControl isRequired>
                <Input
                  id="nameFR"
                  name="nameFR"
                  onChange={handleChange}
                  value={values.nameFR}
                  placeholder={t`Name FR`}
                />
                <FormErrorMessage>Error!</FormErrorMessage>
              </FormControl>
            </Stack>

            <Stack mb="4">
              <Text fontSize="lg" fontWeight="bold">
                <Trans>Acronym:</Trans>
              </Text>
              <AcronymField name="acronymEN" placeholder={t`Acronym EN`} />
              <AcronymField name="acronymFR" placeholder={t`Acronym FR`} />
            </Stack>

            <Stack mb="4">
              <Text fontSize="lg" fontWeight="bold">
                <Trans>Zone:</Trans>
              </Text>
              <FormControl isRequired>
                <Input
                  id="zoneEN"
                  name="zoneEN"
                  onChange={handleChange}
                  value={values.zoneEN}
                  placeholder={t`Zone EN`}
                />
                <FormErrorMessage>Error!</FormErrorMessage>
              </FormControl>
              <FormControl isRequired>
                <Input
                  id="zoneFR"
                  name="zoneFR"
                  onChange={handleChange}
                  value={values.zoneFR}
                  placeholder={t`Zone FR`}
                />
                <FormErrorMessage>Error!</FormErrorMessage>
              </FormControl>
            </Stack>

            <Stack mb="4">
              <Text fontSize="lg" fontWeight="bold">
                <Trans>Sector:</Trans>
              </Text>
              <FormControl>
                <Input
                  id="sectorEN"
                  name="sectorEN"
                  onChange={handleChange}
                  value={values.sectorEN}
                  placeholder={t`Sector EN`}
                />
                <FormErrorMessage>Error!</FormErrorMessage>
              </FormControl>
              <FormControl>
                <Input
                  id="sectorFR"
                  name="sectorFR"
                  onChange={handleChange}
                  value={values.sectorFR}
                  placeholder={t`Sector FR`}
                />
                <FormErrorMessage>Error!</FormErrorMessage>
              </FormControl>
            </Stack>

            <Stack mb="4">
              <Text fontSize="lg" fontWeight="bold">
                <Trans>City:</Trans>
              </Text>
              <FormControl>
                <Input
                  id="cityEN"
                  name="cityEN"
                  onChange={handleChange}
                  value={values.cityEN}
                  placeholder={t`City EN`}
                />
                <FormErrorMessage>Error!</FormErrorMessage>
              </FormControl>
              <FormControl>
                <Input
                  id="cityFR"
                  name="cityFR"
                  onChange={handleChange}
                  value={values.cityFR}
                  placeholder={t`City FR`}
                />
                <FormErrorMessage>Error!</FormErrorMessage>
              </FormControl>
            </Stack>

            <Stack mb="4">
              <Text fontSize="lg" fontWeight="bold">
                <Trans>Province:</Trans>
              </Text>
              <FormControl>
                <Input
                  id="provinceEN"
                  name="provinceEN"
                  onChange={handleChange}
                  //
                  value={values.provinceEN}
                  placeholder={t`Province EN`}
                />
                <FormErrorMessage>Error!</FormErrorMessage>
              </FormControl>
              <FormControl>
                <Input
                  id="provinceFR"
                  name="provinceFR"
                  onChange={handleChange}
                  value={values.provinceFR}
                  placeholder={t`Province FR`}
                />
                <FormErrorMessage>Error!</FormErrorMessage>
              </FormControl>
            </Stack>

            <Stack mb="4">
              <Text fontSize="lg" fontWeight="bold">
                <Trans>Country:</Trans>
              </Text>
              <FormControl>
                <Input
                  id="countryEN"
                  name="countryEN"
                  onChange={handleChange}
                  value={values.countryEN}
                  placeholder={t`Country EN`}
                />
                <FormErrorMessage>Error!</FormErrorMessage>
              </FormControl>
              <FormControl>
                <Input
                  id="countryFR"
                  name="countryFR"
                  onChange={handleChange}
                  value={values.countryFR}
                  placeholder={t`Country FR`}
                />
                <FormErrorMessage>Error!</FormErrorMessage>
              </FormControl>
            </Stack>

            <Stack spacing={4} isInline justifyContent="space-between" mb="4">
              <TrackerButton
                type="submit"
                id="submitBtn"
                isLoading={isSubmitting}
                variant="primary"
              >
                <Trans>Create Organization</Trans>
              </TrackerButton>

              <Button
                as={RouteLink}
                to="/admin"
                color="primary"
                bg="transparent"
                borderColor="primary"
                borderWidth="1px"
              >
                <Trans>Back</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Box>
  )
}
