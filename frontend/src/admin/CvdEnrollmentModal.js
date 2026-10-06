import React from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  useToast,
} from '@chakra-ui/react'
import { bool, func, object, string } from 'prop-types'
import { Formik } from 'formik'
import { useMutation } from '@apollo/client'

import { UPDATE_CVD_ENROLLMENT } from '../graphql/mutations'
import { CvdEnrollmentForm } from './CvdEnrollmentForm'

const CVD_ENROLLMENT_FIELDS = [
  'status',
  'description',
  'maxSeverity',
  'confidentialityRequirement',
  'integrityRequirement',
  'availabilityRequirement',
]

const isBlank = (value) => value === '' || value === null || value === undefined

const changedCvdFields = (current, initial) =>
  Object.fromEntries(
    CVD_ENROLLMENT_FIELDS.filter((key) => current[key] !== initial[key] && !isBlank(current[key])).map((key) => [
      key,
      current[key],
    ]),
  )

export function CvdEnrollmentModal({ isOpen, onClose, domainId, orgId, domain, cvdEnrollment }) {
  const toast = useToast()
  const { t } = useLingui()

  const { __typename, ...existingEnrollment } = cvdEnrollment || {}
  const initialCvdEnrollment = { status: 'NOT_ENROLLED', ...existingEnrollment }

  const [updateCvdEnrollment] = useMutation(UPDATE_CVD_ENROLLMENT, {
    refetchQueries: ['FindAuditLogs'],
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
    onCompleted({ updateCvdEnrollment }) {
      if (updateCvdEnrollment.result.__typename === 'Domain') {
        onClose()
        toast({
          title: t`CVD enrollment updated`,
          description: t`CVD enrollment for ${domain} successfully updated.`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else if (updateCvdEnrollment.result.__typename === 'DomainError') {
        toast({
          title: t`Unable to update CVD enrollment.`,
          description: updateCvdEnrollment.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect updateCvdEnrollment.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      }
    },
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} motionPreset="slideInBottom">
      <ModalOverlay />
      <ModalContent pb={4}>
        <Formik
          initialValues={{ cvdEnrollment: initialCvdEnrollment }}
          onSubmit={async (values) => {
            const changes = changedCvdFields(values.cvdEnrollment, initialCvdEnrollment)
            if (Object.keys(changes).length === 0) return

            await updateCvdEnrollment({ variables: { domainId, orgId, ...changes } })
          }}
        >
          {({ handleSubmit, handleChange, isSubmitting, values }) => {
            const hasChanges = Object.keys(changedCvdFields(values.cvdEnrollment, initialCvdEnrollment)).length > 0

            return (
              <form id="cvd-enrollment-form" onSubmit={handleSubmit}>
                <ModalHeader>
                  <Trans>Edit CVD Enrollment: {domain}</Trans>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Stack spacing={4} p={25}>
                    <CvdEnrollmentForm handleChange={handleChange} values={values} />
                  </Stack>
                </ModalBody>
                <ModalFooter>
                  <Button variant="primary" isLoading={isSubmitting} isDisabled={!hasChanges} type="submit" mr="4">
                    <Trans>Save</Trans>
                  </Button>
                </ModalFooter>
              </form>
            )
          }}
        </Formik>
      </ModalContent>
    </Modal>
  )
}

CvdEnrollmentModal.propTypes = {
  isOpen: bool,
  onClose: func.isRequired,
  domainId: string,
  orgId: string,
  domain: string,
  cvdEnrollment: object,
}
