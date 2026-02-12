import React, { useRef } from 'react'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react'
import { AddIcon, QuestionOutlineIcon } from '@chakra-ui/icons'
import { array, bool, func, number, object, string } from 'prop-types'
import { FieldArray, Formik } from 'formik'
import { useMutation } from '@apollo/client'
import { ABTestVariant, ABTestWrapper } from '../app/ABTestWrapper'

import { DomainField } from '../components/fields/DomainField'
import { CREATE_DOMAIN, UPDATE_DOMAIN } from '../graphql/mutations'
import withSuperAdmin from '../app/withSuperAdmin'

export function AdminDomainModal({
  isOpen,
  onClose,
  validationSchema,
  orgId,
  availableTags,
  editingDomainId,
  editingDomainUrl,
  tagInputList,
  orgSlug,
  archived,
  assetState,
  mutation,
  orgCount,
  cvdEnrolled,
  permission,
  ...rest
}) {
  const toast = useToast()
  const initialFocusRef = useRef()
  const { i18n } = useLingui()

  const [createDomain] = useMutation(CREATE_DOMAIN, {
    refetchQueries: ['PaginatedOrgDomains', 'FindAuditLogs'],
    onError(error) {
      toast({
        title: i18n._(t`An error occurred.`),
        description: error.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ createDomain }) {
      if (createDomain.result.__typename === 'Domain') {
        onClose()
        toast({
          title: i18n._(t`Domain added`),
          description: i18n._(t`${createDomain.result.domain} was added to ${orgSlug}`),
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else if (createDomain.result.__typename === 'DomainError') {
        toast({
          title: i18n._(t`Unable to create new domain.`),
          description: createDomain.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: i18n._(t`Incorrect send method received.`),
          description: i18n._(t`Incorrect createDomain.result typename.`),
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect createDomain.result typename.')
      }
    },
  })

  const [updateDomain] = useMutation(UPDATE_DOMAIN, {
    refetchQueries: ['FindAuditLogs'],
    onError(error) {
      toast({
        title: i18n._(t`An error occurred.`),
        description: error.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ updateDomain }) {
      if (updateDomain.result.__typename === 'Domain') {
        onClose()
        toast({
          title: i18n._(t`Domain updated`),
          description: i18n._(
            t`${editingDomainUrl} from ${orgSlug} successfully updated to ${updateDomain.result.domain}`,
          ),
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else if (updateDomain.result.__typename === 'DomainError') {
        toast({
          title: i18n._(t`Unable to update domain.`),
          description: updateDomain.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: i18n._(t`Incorrect send method received.`),
          description: i18n._(t`Incorrect updateDomain.result typename.`),
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect updateDomain.result typename.')
      }
    },
    update: (cache, { data }) => {
      if (data.updateDomain.result.__typename !== 'Domain') return

      const updateDomainId = cache.identify(data.updateDomain.result)
      cache.modify({
        id: updateDomainId,
        fields: {
          claimTags() {
            return data.updateDomain.result.claimTags
          },
        },
      })
    },
  })

  const addableTags = (values, helper) => {
    const stringValues = values?.map(({ tagId }) => {
      return tagId
    })
    const difference = availableTags.filter(({ tagId }) => !stringValues?.includes(tagId))
    return difference?.map((tag, idx) => {
      return (
        <Button
          key={idx}
          id={`add-tag-${tag.tagId}`}
          _hover={{ bg: 'gray.200' }}
          borderRadius="full"
          onClick={() => {
            helper.push(tag)
          }}
          bg="#f2f2f2"
          fontWeight="normal"
          size="sm"
        >
          {tag.label.toUpperCase()}
          <AddIcon color="gray.500" ml="auto" />
        </Button>
      )
    })
  }

  const getInitTags = () => {
    let tags = tagInputList?.map((label) => {
      return availableTags.filter((option) => option.tagId == label.tagId)[0]
    })
    if (mutation === 'create' && tags.filter(({ tagId }) => tagId === 'new-nouveau').length === 0) {
      const newTag = availableTags.filter(({ tagId }) => tagId === 'new-nouveau')[0]
      newTag && tags.push(newTag)
    }
    return tags
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} initialFocusRef={initialFocusRef} motionPreset="slideInBottom" {...rest}>
      <ModalOverlay />
      <ModalContent pb={4}>
        <Formik
          initialValues={{
            domainUrl: editingDomainUrl,
            // convert initial tags to input type
            tags: getInitTags(),
            archiveDomain: archived,
            assetState: assetState || 'APPROVED',
            cvdEnrolled: cvdEnrolled || {
              status: 'NOT_ENROLLED',
              description: '',
              maxSeverity: '',
              confidentialityRequirement: '',
              integrityRequirement: '',
              availabilityRequirement: '',
            },
          }}
          initialTouched={{
            domainUrl: true,
          }}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            // Submit update detail mutation
            if (mutation === 'update') {
              await updateDomain({
                variables: {
                  domainId: editingDomainId,
                  orgId: orgId,
                  tags: values.tags.map(({ tagId }) => tagId),
                  archived: values.archiveDomain,
                  assetState: values.assetState,
                  ignoreRua: values.ignoreRua,
                  cvdEnrolled: values.cvdEnrolled,
                },
              })
            } else if (mutation === 'create') {
              await createDomain({
                variables: {
                  orgId: orgId,
                  domain: values.domainUrl.trim(),
                  tags: values.tags.map(({ tagId }) => tagId),
                  archived: values.archiveDomain,
                  assetState: values.assetState,
                  cvdEnrolled: values.cvdEnrolled,
                },
              })
            }
          }}
        >
          {({ handleSubmit, handleChange, isSubmitting, values }) => (
            <form id="form" onSubmit={handleSubmit}>
              <ModalHeader>
                {mutation === 'update' ? <Trans>Edit Domain Details</Trans> : <Trans>Add Domain Details</Trans>}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Stack spacing={4} p={25}>
                  {mutation === 'create' ? (
                    <DomainField name="domainUrl" label={t`New Domain URL:`} placeholder={t`New Domain URL`} />
                  ) : (
                    <Box>
                      <Text fontWeight="bold">Domain:</Text>
                      <Text flexWrap="wrap">{editingDomainUrl}</Text>
                    </Box>
                  )}
                  <FieldArray
                    name="tags"
                    render={(arrayHelpers) => (
                      <Box>
                        <Text fontWeight="bold">Tags:</Text>
                        <SimpleGrid columns={3} spacing={2}>
                          {values.tags?.map(({ tagId, label, description }, idx) => {
                            return (
                              <Tag key={idx} borderRadius="full" py="2" px="3">
                                <Tooltip label={description} aria-label={`tag-tooltip-${tagId}`}>
                                  <TagLabel>{label.toUpperCase()}</TagLabel>
                                </Tooltip>
                                <TagCloseButton
                                  ml="auto"
                                  onClick={() => arrayHelpers.remove(idx)}
                                  aria-label={`remove-tag-${tagId}`}
                                />
                              </Tag>
                            )
                          })}
                        </SimpleGrid>
                        <Divider borderBottomColor="gray.900" />
                        <SimpleGrid columns={3} spacing={2}>
                          {addableTags(values.tags, arrayHelpers)}
                        </SimpleGrid>
                      </Box>
                    )}
                  />
                  <FormControl>
                    <FormLabel htmlFor="assetState" fontWeight="bold">
                      <Tooltip
                        label={t`Select a state that best describes the asset in relation to your organization.`}
                      >
                        <Flex align="center">
                          <Trans>Asset State</Trans> <QuestionOutlineIcon ml="2" color="gray.500" boxSize="icons.md" />
                        </Flex>
                      </Tooltip>
                    </FormLabel>
                    <Select
                      name="assetState"
                      id="assetState"
                      borderColor="black"
                      onChange={handleChange}
                      defaultValue={assetState}
                    >
                      <option value="APPROVED">
                        <Trans>Approved</Trans>
                      </option>
                      <option value="DEPENDENCY">
                        <Trans>Dependency</Trans>
                      </option>
                      <option value="MONITOR_ONLY">
                        <Trans>Monitor Only</Trans>
                      </option>
                      <option value="CANDIDATE">
                        <Trans>Candidate</Trans>
                      </option>
                      <option value="REQUIRES_INVESTIGATION">
                        <Trans>Requires Investigation</Trans>
                      </option>
                    </Select>
                  </FormControl>

                  {/* CVD Enrollment Fields */}
                  <ABTestWrapper insiderVariantName="B">
                    <ABTestVariant name="B">
                      <FormControl>
                        <FormLabel htmlFor="cvdEnrolled" fontWeight="bold">
                          <Tooltip label={t`Select the CVD enrollment status for this asset.`}>
                            <Flex align="center">
                              <Trans>CVD Enrollment Status</Trans>
                              <QuestionOutlineIcon ml="2" color="gray.500" boxSize="icons.md" />
                            </Flex>
                          </Tooltip>
                        </FormLabel>
                        <Select
                          name="cvdEnrolled.status"
                          id="cvdEnrolled.status"
                          borderColor="black"
                          onChange={handleChange}
                          value={values.cvdEnrolled.status}
                        >
                          <option value="NOT_ENROLLED">
                            <Trans>Not Enrolled</Trans>
                          </option>
                          {permission === 'ADMIN' ? (
                            <option value="PENDING">
                              <Trans>Pending</Trans>
                            </option>
                          ) : (
                            <option value="ENROLLED">
                              <Trans>Enrolled</Trans>
                            </option>
                          )}
                        </Select>
                      </FormControl>

                      {values.cvdEnrolled.status !== 'NOT_ENROLLED' && (
                        <>
                          <FormControl>
                            <FormLabel htmlFor="cvdEnrolled.description" fontWeight="bold">
                              <Tooltip label={t`Provide a description for the asset.`}>
                                <Flex align="center">
                                  <Trans>Description</Trans>
                                </Flex>
                              </Tooltip>
                            </FormLabel>
                            <input
                              type="text"
                              name="cvdEnrolled.description"
                              id="cvdEnrolled.description"
                              value={values.cvdEnrolled.description}
                              onChange={handleChange}
                              style={{ border: '1px solid #000', borderRadius: 4, padding: 8, width: '100%' }}
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel htmlFor="cvdEnrolled.maxSeverity" fontWeight="bold">
                              <Tooltip label={t`Maximum severity allowed on this asset.`}>
                                <Flex align="center">
                                  <Trans>Max Severity</Trans>
                                </Flex>
                              </Tooltip>
                            </FormLabel>
                            <Select
                              name="cvdEnrolled.maxSeverity"
                              id="cvdEnrolled.maxSeverity"
                              borderColor="black"
                              onChange={handleChange}
                              value={values.cvdEnrolled.maxSeverity}
                            >
                              <option value="">
                                <Trans>Select severity</Trans>
                              </option>
                              <option value="LOW">
                                <Trans>Low</Trans>
                              </option>
                              <option value="MEDIUM">
                                <Trans>Medium</Trans>
                              </option>
                              <option value="HIGH">
                                <Trans>High</Trans>
                              </option>
                              <option value="CRITICAL">
                                <Trans>Critical</Trans>
                              </option>
                            </Select>
                          </FormControl>

                          <FormControl>
                            <FormLabel htmlFor="cvdEnrolled.confidentialityRequirement" fontWeight="bold">
                              <Tooltip label={t`Confidentiality Requirement (CVSS environmental modifier).`}>
                                <Flex align="center">
                                  <Trans>Confidentiality Requirement</Trans>
                                </Flex>
                              </Tooltip>
                            </FormLabel>
                            <Select
                              name="cvdEnrolled.confidentialityRequirement"
                              id="cvdEnrolled.confidentialityRequirement"
                              borderColor="black"
                              onChange={handleChange}
                              value={values.cvdEnrolled.confidentialityRequirement || ''}
                            >
                              <option value="">
                                <Trans>Select requirement</Trans>
                              </option>
                              <option value="NONE">
                                <Trans>None</Trans>
                              </option>
                              <option value="LOW">
                                <Trans>Low</Trans>
                              </option>
                              <option value="HIGH">
                                <Trans>High</Trans>
                              </option>
                            </Select>
                          </FormControl>

                          <FormControl>
                            <FormLabel htmlFor="cvdEnrolled.integrityRequirement" fontWeight="bold">
                              <Tooltip label={t`Integrity Requirement (CVSS environmental modifier).`}>
                                <Flex align="center">
                                  <Trans>Integrity Requirement</Trans>
                                </Flex>
                              </Tooltip>
                            </FormLabel>
                            <Select
                              name="cvdEnrolled.integrityRequirement"
                              id="cvdEnrolled.integrityRequirement"
                              borderColor="black"
                              onChange={handleChange}
                              value={values.cvdEnrolled.integrityRequirement || ''}
                            >
                              <option value="">
                                <Trans>Select requirement</Trans>
                              </option>
                              <option value="NONE">
                                <Trans>None</Trans>
                              </option>
                              <option value="LOW">
                                <Trans>Low</Trans>
                              </option>
                              <option value="HIGH">
                                <Trans>High</Trans>
                              </option>
                            </Select>
                          </FormControl>

                          <FormControl>
                            <FormLabel htmlFor="cvdEnrolled.availabilityRequirement" fontWeight="bold">
                              <Tooltip label={t`Availability Requirement (CVSS environmental modifier).`}>
                                <Flex align="center">
                                  <Trans>Availability Requirement</Trans>
                                </Flex>
                              </Tooltip>
                            </FormLabel>
                            <Select
                              name="cvdEnrolled.availabilityRequirement"
                              id="cvdEnrolled.availabilityRequirement"
                              borderColor="black"
                              onChange={handleChange}
                              value={values.cvdEnrolled.availabilityRequirement || ''}
                            >
                              <option value="">
                                <Trans>Select requirement</Trans>
                              </option>
                              <option value="NONE">
                                <Trans>None</Trans>
                              </option>
                              <option value="LOW">
                                <Trans>Low</Trans>
                              </option>
                              <option value="HIGH">
                                <Trans>High</Trans>
                              </option>
                            </Select>
                          </FormControl>
                        </>
                      )}
                    </ABTestVariant>
                  </ABTestWrapper>

                  <IgnoreRuaToggle defaultChecked={values.ignoreRua} handleChange={handleChange} />
                  <ArchiveDomainSwitch
                    defaultChecked={values.archiveDomain}
                    handleChange={handleChange}
                    orgCount={orgCount}
                  />
                  <Text>
                    <Trans>Please allow up to 24 hours for summaries to reflect any changes.</Trans>
                  </Text>
                </Stack>
              </ModalBody>

              <ModalFooter>
                <Button variant="primary" isLoading={isSubmitting} type="submit" mr="4">
                  <Trans>Confirm</Trans>
                </Button>
              </ModalFooter>
            </form>
          )}
        </Formik>
      </ModalContent>
    </Modal>
  )
}

const ArchiveDomainSwitch = withSuperAdmin(({ defaultChecked, handleChange, orgCount }) => {
  return (
    <Box>
      <Flex align="center">
        <Tooltip label={t`Prevent this domain from being visible, scanned, and being counted in any summaries.`}>
          <QuestionOutlineIcon tabIndex={0} />
        </Tooltip>
        <label>
          <Switch
            colorScheme="red"
            isFocusable={true}
            name="archiveDomain"
            mx="2"
            defaultChecked={defaultChecked}
            onChange={handleChange}
          />
        </label>
        <Badge variant="outline" color="gray.900" p="1.5">
          <Trans>Archive domain</Trans>
        </Badge>
      </Flex>

      <Text fontSize="sm">
        {orgCount > 0 ? (
          <Trans>Note: This will affect results for {orgCount} organizations</Trans>
        ) : (
          <Trans>Note: This could affect results for multiple organizations</Trans>
        )}
      </Text>
    </Box>
  )
})

const IgnoreRuaToggle = withSuperAdmin(({ defaultChecked, handleChange }) => {
  return (
    <Box>
      <Flex align="center">
        <label>
          <Switch
            colorScheme="blue"
            isFocusable={true}
            name="ignoreRua"
            mx="2"
            defaultChecked={defaultChecked}
            onChange={handleChange}
          />
        </label>
        <Badge variant="outline" color="gray.900" p="1.5">
          <Trans>Ignore RUA</Trans>
        </Badge>
      </Flex>
    </Box>
  )
})

AdminDomainModal.propTypes = {
  isOpen: bool,
  onClose: func,
  validationSchema: object,
  orgId: string,
  editingDomainId: string,
  editingDomainUrl: string,
  tagInputList: array,
  archived: bool,
  orgSlug: string,
  mutation: string,
  orgCount: number,
  refetchQueries: array,
  myOrg: object,
  assetState: string,
  cvdEnrolled: string,
  availableTags: array,
  permission: string,
}
