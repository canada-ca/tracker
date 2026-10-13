import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'
import { CvdEnrollmentModal } from '../CvdEnrollmentModal'
import { createCache } from '../../client'
import { UserVarProvider } from '../../utilities/userState'
import { UPDATE_CVD_ENROLLMENT } from '../../graphql/mutations'

const domainId = 'testid2='
const orgId = 'testid='

const existingEnrollment = {
  status: 'ENROLLED',
  description: 'Owned asset',
  maxSeverity: 'HIGH',
  confidentialityRequirement: 'LOW',
  integrityRequirement: 'LOW',
  availabilityRequirement: 'NONE',
}

const updateCvdEnrollmentMock = (variables, result) => ({
  request: { query: UPDATE_CVD_ENROLLMENT, variables },
  result: {
    data: {
      updateCvdEnrollment: { result, __typename: 'UpdateDomainPayload' },
    },
  },
})

const domainResult = (status) => ({
  id: domainId,
  cvdEnrollment: { ...existingEnrollment, status, __typename: 'CvdEnrollment' },
  __typename: 'Domain',
})

const renderModal = ({ mocks = [], onClose = jest.fn(), cvdEnrollment = existingEnrollment } = {}) =>
  render(
    <MockedProvider mocks={mocks} cache={createCache()}>
      <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']}>
              <CvdEnrollmentModal
                isOpen={true}
                onClose={onClose}
                domainId={domainId}
                orgId={orgId}
                domain="test.gc.ca"
                cvdEnrollment={{ ...cvdEnrollment, __typename: 'CvdEnrollment' }}
              />
            </MemoryRouter>
          </I18nProvider>
        </ChakraProvider>
      </UserVarProvider>
    </MockedProvider>,
  )

const statusSelect = () => screen.getByRole('combobox', { name: /CVD Enrollment Status/i })
const saveButton = () => screen.getByRole('button', { name: /Save/i })

describe('<CvdEnrollmentModal />', () => {
  it('disables Save until a field changes', async () => {
    renderModal()

    await waitFor(() => expect(saveButton()).toBeDisabled())
    fireEvent.change(statusSelect(), { target: { value: 'DENY' } })
    await waitFor(() => expect(saveButton()).toBeEnabled())
  })

  it('sends only the changed field and shows a success toast', async () => {
    const onClose = jest.fn()
    const mocks = [updateCvdEnrollmentMock({ domainId, orgId, status: 'DENY' }, domainResult('DENY'))]
    renderModal({ mocks, onClose })

    fireEvent.change(statusSelect(), { target: { value: 'DENY' } })
    fireEvent.click(saveButton())

    await waitFor(() => expect(screen.getByText(/CVD enrollment updated/i)).toBeInTheDocument())
    expect(onClose).toHaveBeenCalled()
  })

  it('sends an empty description when an existing description is cleared', async () => {
    const onClose = jest.fn()
    const mocks = [
      updateCvdEnrollmentMock(
        { domainId, orgId, description: '' },
        {
          id: domainId,
          cvdEnrollment: { ...existingEnrollment, description: '', __typename: 'CvdEnrollment' },
          __typename: 'Domain',
        },
      ),
    ]
    renderModal({ mocks, onClose })

    fireEvent.change(screen.getByRole('textbox', { name: /Description/i }), { target: { value: '' } })
    await waitFor(() => expect(saveButton()).toBeEnabled())
    fireEvent.click(saveButton())

    await waitFor(() => expect(screen.getByText(/CVD enrollment updated/i)).toBeInTheDocument())
    expect(onClose).toHaveBeenCalled()
  })

  it('defaults to NOT_ENROLLED and hides extra fields when status is null', async () => {
    renderModal({ cvdEnrollment: { ...existingEnrollment, status: null } })

    await waitFor(() => expect(statusSelect()).toHaveValue('NOT_ENROLLED'))
    expect(screen.queryByRole('textbox', { name: /Description/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /Max Severity/i })).not.toBeInTheDocument()
  })

  it('shows an error toast when the API returns a DomainError', async () => {
    const onClose = jest.fn()
    const mocks = [
      updateCvdEnrollmentMock(
        { domainId, orgId, status: 'DENY' },
        { code: 400, description: 'Permission denied.', __typename: 'DomainError' },
      ),
    ]
    renderModal({ mocks, onClose })

    fireEvent.change(statusSelect(), { target: { value: 'DENY' } })
    fireEvent.click(saveButton())

    await waitFor(() => expect(screen.getByText(/Unable to update CVD enrollment/i)).toBeInTheDocument())
    expect(screen.getByText(/Permission denied./)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})
