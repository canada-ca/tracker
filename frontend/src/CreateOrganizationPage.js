import React from 'react'
import {
  Stack,
  useToast,
  Box,
  Button,
  Heading,
  Input,
  Text,
  // FormLabel,
  FormControl,
  FormErrorMessage,
} from '@chakra-ui/core'
import { Trans, t } from '@lingui/macro'
import { Layout } from './Layout'
import { CREATE_ORGANIZATION } from './graphql/mutations'
import { useMutation } from '@apollo/client'
import { useUserState } from './UserState'
import { LoadingMessage } from './LoadingMessage'
import { Formik } from 'formik'
import { useHistory, Link as RouteLink } from 'react-router-dom'
import { TrackerButton } from './TrackerButton'
import { object, string } from 'yup'
import { i18n } from '@lingui/core'
import { fieldRequirements } from './fieldRequirements'

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
    <Layout>
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
            // createOrganization({
            //   variables: {
            //     acronymEN: values.acronymEN,
            //     acronymFR: values.acronymFR,
            //     nameEN: values.nameEN,
            //     nameFR: values.nameFR,
            //     zoneEN: values.zoneEN,
            //     zoneFR: values.zoneFR,
            //     sectorEN: values.sectorEN,
            //     sectorFR: values.sectorFR,
            //     countryEN: values.countryEN,
            //     countryFR: values.countryFR,
            //     provinceEN: values.provinceEN,
            //     provinceFR: values.provinceFR,
            //     cityEN: values.cityEN,
            //     cityFR: values.cityFR,
            //   },
            // })
            window.alert(JSON.stringify(values))
          }}
        >
          {({
            handleSubmit,
            handleBlur,
            handleChange,
            values,
            isSubmitting,
          }) => (
            <form id="form" onSubmit={handleSubmit}>
              <Heading as="h1" fontSize="2xl" mb="6" textAlign="center">
                <Trans>
                  Create an organization by filling out the following info in
                  both English and French
                </Trans>
              </Heading>

              <Stack mb="4">
                <Text fontSize="lg" fontWeight="bold">
                  <Trans>Name</Trans>
                </Text>
                <FormControl isRequired>
                  <Input
                    type="nameEN"
                    name="nameEN"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.nameEN}
                    placeholder={t`Name EN`}
                  />
                  <FormErrorMessage>Error!</FormErrorMessage>
                </FormControl>
                <FormControl isRequired>
                  <Input
                    type="nameFR"
                    name="nameFR"
                    onChange={handleChange}
                    onBlur={handleBlur}
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
                <FormControl isRequired>
                  <Input
                    type="acronymEN"
                    name="acronymEN"
                    id="acronymEN"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.acronymEN}
                    placeholder={t`Acronym EN`}
                  />
                  <FormErrorMessage>Error!</FormErrorMessage>
                </FormControl>
                <FormControl isRequired>
                  <Input
                    type="acronymFR"
                    name="acronymFR"
                    id="acronymFR"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.acronymFR}
                    placeholder={t`Acronym FR`}
                  />
                  <FormErrorMessage>Error!</FormErrorMessage>
                </FormControl>
              </Stack>

              <Stack mb="4">
                <Text fontSize="lg" fontWeight="bold">
                  <Trans>Zone:</Trans>
                </Text>
                <FormControl isRequired>
                  <Input
                    type="zoneEN"
                    name="zoneEN"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.zoneEN}
                    placeholder={t`Zone EN`}
                  />
                  <FormErrorMessage>Error!</FormErrorMessage>
                </FormControl>
                <FormControl isRequired>
                  <Input
                    type="zoneFR"
                    name="zoneFR"
                    onChange={handleChange}
                    onBlur={handleBlur}
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
                    type="sectorEN"
                    name="sectorEN"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.sectorEN}
                    placeholder={t`Sector EN`}
                  />
                  <FormErrorMessage>Error!</FormErrorMessage>
                </FormControl>
                <FormControl>
                  <Input
                    type="sectorFR"
                    name="sectorFR"
                    onChange={handleChange}
                    onBlur={handleBlur}
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
                    type="cityEN"
                    name="cityEN"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.cityEN}
                    placeholder={t`City EN`}
                  />
                  <FormErrorMessage>Error!</FormErrorMessage>
                </FormControl>
                <FormControl>
                  <Input
                    type="cityFR"
                    name="cityFR"
                    onChange={handleChange}
                    onBlur={handleBlur}
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
                    type="provinceEN"
                    name="provinceEN"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.provinceEN}
                    placeholder={t`Province EN`}
                  />
                  <FormErrorMessage>Error!</FormErrorMessage>
                </FormControl>
                <FormControl>
                  <Input
                    type="provinceFR"
                    name="provinceFR"
                    onChange={handleChange}
                    onBlur={handleBlur}
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
                    type="countryEN"
                    name="countryEN"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.countryEN}
                    placeholder={t`Country EN`}
                  />
                  <FormErrorMessage>Error!</FormErrorMessage>
                </FormControl>
                <FormControl>
                  <Input
                    type="countryFR"
                    name="countryFR"
                    onChange={handleChange}
                    onBlur={handleBlur}
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
    </Layout>
  )
}
