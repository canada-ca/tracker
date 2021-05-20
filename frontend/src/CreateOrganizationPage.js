import React from 'react'
import {
  Stack,
  useToast,
  Box,
  Button,
  Heading,
  Input,
  Text,
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

export default function CreateOrganizationPage() {
  const { currentUser } = useUserState()
  const toast = useToast()
  const history = useHistory()

  const validationSchema = object().shape({
    nameEN: string(),
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
                  Create an account by entering an email and password.
                </Trans>
              </Heading>

              <Stack mb="4">
                <Text fontSize="lg" fontWeight="bold">
                  <Trans>Name:</Trans>
                </Text>
                <Input
                  type="nameEN"
                  name="nameEN"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.nameEN}
                  placeholder="Name EN"
                />
                <Input
                  type="nameFR"
                  name="nameFR"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.nameFR}
                  placeholder="Name FR"
                />
              </Stack>

              <Stack mb="4">
                <Text fontSize="lg" fontWeight="bold">
                  <Trans>Acronym:</Trans>
                </Text>
                <Input
                  type="acronymEN"
                  name="acronymEN"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.acronymEN}
                  placeholder="Acronym EN"
                />
                <Input
                  type="acronymFR"
                  name="acronymFR"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.acronymFR}
                  placeholder="Acronym FR"
                />
              </Stack>

              <Stack mb="4">
                <Text fontSize="lg" fontWeight="bold">
                  <Trans>Zone:</Trans>
                </Text>
                <Input
                  type="zoneEN"
                  name="zoneEN"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.zoneEN}
                  placeholder="Zone EN"
                />
                <Input
                  type="zoneFR"
                  name="zoneFR"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.zoneFR}
                  placeholder="Zone FR"
                />
              </Stack>

              <Stack mb="4">
                <Text fontSize="lg" fontWeight="bold">
                  <Trans>Sector:</Trans>
                </Text>
                <Input
                  type="sectorEN"
                  name="sectorEN"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.sectorEN}
                  placeholder="Sector EN"
                />
                <Input
                  type="sectorFR"
                  name="sectorFR"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.sectorFR}
                  placeholder="Sector FR"
                />
              </Stack>

              <Stack mb="4">
                <Text fontSize="lg" fontWeight="bold">
                  <Trans>City:</Trans>
                </Text>
                <Input
                  type="cityEN"
                  name="cityEN"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.cityEN}
                  placeholder="City EN"
                />
                <Input
                  type="cityFR"
                  name="cityFR"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.cityFR}
                  placeholder="City FR"
                />
              </Stack>

              <Stack mb="4">
                <Text fontSize="lg" fontWeight="bold">
                  <Trans>Province:</Trans>
                </Text>
                <Input
                  type="provinceEN"
                  name="provinceEN"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.provinceEN}
                  placeholder="Province EN"
                />
                <Input
                  type="provinceFR"
                  name="provinceFR"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.provinceFR}
                  placeholder="Province FR"
                />
              </Stack>

              <Stack mb="4">
                <Text fontSize="lg" fontWeight="bold">
                  <Trans>Country:</Trans>
                </Text>
                <Input
                  type="countryEN"
                  name="countryEN"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.countryEN}
                  placeholder="Country EN"
                />
                <Input
                  type="countryFR"
                  name="countryFR"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.countryFR}
                  placeholder="Country FR"
                />
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
