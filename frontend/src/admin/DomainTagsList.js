import React, { useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Collapse,
  Flex,
  Grid,
  IconButton,
  Select,
  Switch,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react'
import { FIND_ALL_TAGS } from '../graphql/queries'
import { useMutation, useQuery } from '@apollo/client'
import { CREATE_TAG, UPDATE_TAG } from '../graphql/mutations'
import { t, Trans } from '@lingui/macro'
import { EditIcon, PlusSquareIcon, ViewOffIcon } from '@chakra-ui/icons'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { Formik } from 'formik'
import { FormField } from '../components/fields/FormField'
import { getRequirement, schemaToValidation } from '../utilities/fieldRequirements'

export const DomainTagsList = () => {
  // Use an object to track which tag is being edited
  const [editingTags, setEditingTags] = useState({})
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const toast = useToast()

  const fieldRequirement = getRequirement('field')
  const validationSchema = schemaToValidation({
    labelEn: fieldRequirement,
    labelFr: fieldRequirement,
    isVisible: fieldRequirement,
    ownership: fieldRequirement,
  })

  const { loading, error, data } = useQuery(FIND_ALL_TAGS, {
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

  const [updateTag, { updateLoading }] = useMutation(UPDATE_TAG, {
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
        setIsCreatingTag(false)
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

  if (loading) return <LoadingMessage />
  if (error) return <ErrorFallbackMessage />

  const ownershipBadgeColour = (ownership) => {
    switch (ownership) {
      case 'GLOBAL':
        return 'weak'
      case 'ORG':
        return 'info'
      default:
        return 'primary'
    }
  }

  const tagForm = ({ isLoading, mutation, tagId = '', visible = true, ownership = '' }) => {
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
        }}
        initialTouched={{
          labelEn: true,
        }}
        validationSchema={mutation === 'create' ? validationSchema : null}
        onSubmit={async (values, formikHelpers) => {
          if (mutation === 'create') {
            await createTag({ variables: { ...values } })
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
              setEditingTags(!!editingTags[tagId])
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
              <Box gridColumn={{ base: 'span 4', md: 'span 2' }}>
                <Flex align="center">
                  <Text mr="2" fontWeight="bold">
                    <Trans>Ownership:</Trans>
                  </Text>
                  <Select id="ownership" name="ownership" defaultValue={ownership} isRequired onChange={handleChange}>
                    <option value="" hidden>
                      <Trans>Select an ownership level</Trans>
                    </option>
                    <option value="GLOBAL">Global</option>
                    <option value="ORG">Organization</option>
                  </Select>
                </Flex>
              </Box>
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
                onClick={() => setIsCreatingTag(false)}
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

  return (
    <Box>
      <Box mb="4">
        <Button
          variant="primary"
          onClick={() => setIsCreatingTag(!isCreatingTag)}
          rightIcon={<PlusSquareIcon boxSize="icons.lg" />}
          mb="2"
        >
          Add Tag
        </Button>
        <Collapse in={isCreatingTag}>{tagForm({ isLoading: createLoading, mutation: 'create' })}</Collapse>
      </Box>

      {data.findAllTags.map(({ tagId, label, description, isVisible, ownership, _organizations }) => {
        return (
          <Box key={tagId}>
            <Flex align="center" mb="2">
              <IconButton
                aria-label={`edit tag`}
                icon={<EditIcon boxSize="icons.md" />}
                variant="primary"
                onClick={() => setEditingTags((prev) => ({ ...prev, [tagId]: !prev[tagId] }))}
                mr="2"
              />
              <Flex
                w="100%"
                align="center"
                justifyContent="space-between"
                bg="gray.100"
                px="2"
                py="1"
                rounded="md"
                borderWidth="1px"
                borderColor="black"
              >
                <Flex align="center">
                  <Tooltip label={description} aria-label={`tag-tooltip-${tagId}`} placement="right">
                    <Text fontWeight="bold" mr="2">
                      {label.toUpperCase()}
                    </Text>
                  </Tooltip>
                  {!isVisible && <ViewOffIcon boxSize="icons.md" />}
                </Flex>

                <Badge
                  variant="solid"
                  bg={ownershipBadgeColour(ownership)}
                  mr={{ md: '1rem' }}
                  justifySelf={{ base: 'start', md: 'end' }}
                >
                  {ownership}
                </Badge>
              </Flex>
            </Flex>
            <Collapse in={!!editingTags[tagId]}>
              {tagForm({ isLoading: updateLoading, mutation: 'update', visible: isVisible, ownership, tagId })}
            </Collapse>
          </Box>
        )
      })}
    </Box>
  )
}
