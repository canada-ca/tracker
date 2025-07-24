import React from 'react'
import { Badge, Box, Button, Flex, FormLabel, Grid, Select, Switch, useToast } from '@chakra-ui/react'
import { useMutation } from '@apollo/client'
import { CREATE_TAG, UPDATE_TAG } from '../graphql/mutations'
import { t, Trans } from '@lingui/macro'
import { Formik } from 'formik'
import { FormField } from '../components/fields/FormField'
import { getRequirement, schemaToValidation } from '../utilities/fieldRequirements'
import { bool, string, func } from 'prop-types'
import withSuperAdmin from '../app/withSuperAdmin'

export function TagForm({ mutation, tagId = '', visible = true, ownership, setTagFormState, orgId }) {
  const toast = useToast()

  const fieldRequirement = getRequirement('field')
  const validationSchema = schemaToValidation({
    labelEn: fieldRequirement,
    labelFr: fieldRequirement,
    isVisible: fieldRequirement,
    ownership: fieldRequirement,
  })

  const [updateTag, { loading: updateLoading }] = useMutation(UPDATE_TAG, {
    refetchQueries: ['FindAllTags'],
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
    onCompleted({ updateTag }) {
      if (updateTag.result.__typename === 'Tag') {
        toast({
          title: t`Tag updated`,
          description: t`${updateTag.result.tagId} was successfully updated.`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else if (updateTag.result.__typename === 'TagError') {
        toast({
          title: t`Unable to create new global tag.`,
          description: updateTag.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: `Incorrect updateTag.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect updateTag.result typename.')
      }
    },
  })

  const [createTag, { loading: createLoading }] = useMutation(CREATE_TAG, {
    refetchQueries: ['FindAllTags'],
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
    onCompleted({ createTag }) {
      if (createTag.result.__typename === 'Tag') {
        toast({
          title: t`Tag created`,
          description: t`${createTag.result.tag} was added to tag list.`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        setTagFormState((prev) => ({ ...prev, isCreatingTag: false }))
      } else if (createTag.result.__typename === 'TagError') {
        toast({
          title: t`Unable to create new global tag.`,
          description: createTag.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: `Incorrect createTag.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect createTag.result typename.')
      }
    },
  })

  const isLoading = createLoading || updateLoading

  return (
    <Formik
      validateOnBlur={false}
      initialValues={{
        labelEn: '',
        labelFr: '',
        descriptionEn: '',
        descriptionFr: '',
        isVisible: visible,
        ownership,
        orgId,
      }}
      initialTouched={{
        labelEn: true,
      }}
      validationSchema={mutation === 'create' ? validationSchema : null}
      onSubmit={async (values, formikHelpers) => {
        if (mutation === 'create') {
          await createTag({ variables: values })
        } else if (mutation === 'update') {
          // Update the organization (only include fields that have values)
          const propertiesWithValues = {}

          // Extract only the entries that have truthy values
          Object.entries(values).forEach((entry) => {
            const [key, value] = entry
            if ((key === 'isVisible' && value !== visible) || value) propertiesWithValues[key] = value
          })

          // Handle case where user does not supply any fields to update
          if (Object.keys(propertiesWithValues).length === 0) {
            toast({
              title: t`Tag not updated`,
              description: t`No values were supplied when attempting to update organization details.`,
              status: 'warning',
              duration: 9000,
              isClosable: true,
              position: 'top-left',
            })

            return
          }

          const updateResponse = await updateTag({
            variables: {
              tagId,
              ...propertiesWithValues,
            },
          })
          // Close and reset form if successfully updated organization
          if (updateResponse.data.updateTag.result.__typename === 'Tag') {
            setTagFormState((prev) => ({
              ...prev,
              editingTags: { ...prev.editingTags, [tagId]: false },
            }))
            formikHelpers.resetForm()
          }
        }
      }}
    >
      {({ handleSubmit, handleReset, handleChange }) => (
        <form onSubmit={handleSubmit}>
          <Grid gridTemplateColumns="repeat(4, 1fr)" gridRowGap="0.5rem" gridColumnGap="1.5rem" mx="1rem" mb="1.5rem">
            <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
              <FormField name="labelEn" label={t`Label (EN)`} />
            </Box>
            <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
              <FormField name="labelFr" label={t`Label (FR)`} />
            </Box>
            <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
              <FormField name="descriptionEn" label={t`Description (EN)`} />
            </Box>
            <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
              <FormField name="descriptionFr" label={t`Description (FR)`} />
            </Box>
            <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
              <Flex p="1" align="center">
                <Switch
                  isFocusable={true}
                  id="isVisible"
                  name="isVisible"
                  aria-label="isVisible"
                  mx="2"
                  defaultChecked={visible}
                  onChange={handleChange}
                />
                <Badge variant="outline" color="gray.900" p="1.5">
                  <Trans>Visible</Trans>
                </Badge>
              </Flex>
            </Box>
            <OwnershipSelect ownership={ownership} handleChange={handleChange} />
            <Button
              variant="danger"
              type="reset"
              onClick={handleReset}
              gridColumn={{ base: '1 / 3', md: '1 / 2' }}
              isLoading={isLoading}
            >
              <Trans>Clear</Trans>
            </Button>
            <Button
              variant="primaryOutline"
              type="button"
              onClick={() => {
                if (mutation === 'create') {
                  setTagFormState((prev) => ({ ...prev, isCreatingTag: false }))
                } else if (mutation === 'update') {
                  setTagFormState((prev) => ({
                    ...prev,
                    editingTags: { ...prev.editingTags, [tagId]: false },
                  }))
                }
              }}
              gridColumn={{ base: '3 / 5', md: '3 / 4' }}
              isLoading={isLoading}
            >
              <Trans>Close</Trans>
            </Button>
            <Button variant="primary" type="submit" gridColumn={{ base: '1 / 5', md: '4 / 5' }} isLoading={isLoading}>
              <Trans>Confirm</Trans>
            </Button>
          </Grid>
        </form>
      )}
    </Formik>
  )
}

const OwnershipSelect = withSuperAdmin(({ ownership, handleChange }) => {
  return (
    <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
      <Flex align="center">
        <FormLabel htmlFor="ownership" mr="2" fontWeight="bold">
          <Trans>Ownership:</Trans>
        </FormLabel>
        <Select id="ownership" name="ownership" defaultValue={ownership} isRequired onChange={handleChange}>
          <option value="" hidden>
            <Trans>Select an ownership level</Trans>
          </option>
          <option value="GLOBAL">
            <Trans>Global</Trans>
          </option>
          <option value="ORG">
            <Trans>Organization</Trans>
          </option>
        </Select>
      </Flex>
    </Box>
  )
})

TagForm.propTypes = {
  mutation: string,
  tagId: string,
  visible: bool,
  ownership: string,
  setTagFormState: func,
  orgId: string,
}
