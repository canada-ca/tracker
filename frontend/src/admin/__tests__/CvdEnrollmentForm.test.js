import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { en } from 'make-plural/plurals'
import { CvdEnrollmentForm } from '../CvdEnrollmentForm'
import '@testing-library/jest-dom'

const i18n = setupI18n({
  locale: 'en',
  messages: { en: {} },
  localeData: { en: { plurals: en } },
})

describe('<CvdEnrollmentForm>', () => {
  const baseValues = {
    cvdEnrollment: {
      status: 'NOT_ENROLLED',
      description: '',
      maxSeverity: '',
      confidentialityRequirement: '',
      integrityRequirement: '',
      availabilityRequirement: '',
    },
  }
  const handleChange = jest.fn()

  function renderForm(props) {
    return render(
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <CvdEnrollmentForm {...props} />
        </I18nProvider>
      </ChakraProvider>,
    )
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders the enrollment status select and info popover', () => {
    renderForm({ values: baseValues, handleChange, permission: 'USER' })
    expect(screen.getAllByText(/CVD Enrollment Status/i)[0]).toBeInTheDocument()
    expect(screen.getByText(/More Info/i)).toBeInTheDocument()
    expect(screen.getByText(/Not Enrolled/i)).toBeInTheDocument()
  })

  it('shows Pending option for ADMIN permission', () => {
    renderForm({
      values: { cvdEnrollment: { ...baseValues.cvdEnrollment, status: 'PENDING' } },
      handleChange,
      permission: 'ADMIN',
    })
    // Use queryByText with fallback for option
    const pendingOption = screen.queryByText((content, element) => {
      return element.tagName && element.tagName.toLowerCase() === 'option' && /Pending/i.test(content)
    })
    expect(pendingOption).not.toBeNull()
  })

  it('shows Enrolled option for OWNER permission', () => {
    renderForm({
      values: { cvdEnrollment: { ...baseValues.cvdEnrollment, status: 'ENROLLED' } },
      handleChange,
      permission: 'OWNER',
    })
    expect(screen.getAllByText(/Enrolled/i)[0]).toBeInTheDocument()
  })

  it('renders additional fields when status is not NOT_ENROLLED', () => {
    renderForm({
      values: {
        cvdEnrollment: {
          ...baseValues.cvdEnrollment,
          status: 'ENROLLED',
          description: 'desc',
          maxSeverity: 'HIGH',
          confidentialityRequirement: 'LOW',
          integrityRequirement: 'HIGH',
          availabilityRequirement: 'LOW',
        },
      },
      handleChange,
      permission: 'OWNER',
    })
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Max Severity/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Confidentiality Requirement/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Integrity Requirement/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Availability Requirement/i)).toBeInTheDocument()
  })

  it('calls handleChange when status is changed', () => {
    renderForm({ values: baseValues, handleChange, permission: 'ADMIN' })
    // Use getByRole to select by combobox and name
    const select = screen.getByRole('combobox', { name: /CVD Enrollment Status/i })
    fireEvent.change(select, {
      target: { value: 'PENDING' },
    })
    expect(handleChange).toHaveBeenCalled()
  })

  it('calls handleChange for description input', () => {
    renderForm({
      values: {
        cvdEnrollment: { ...baseValues.cvdEnrollment, status: 'ENROLLED' },
      },
      handleChange,
      permission: 'OWNER',
    })
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Test description' },
    })
    expect(handleChange).toHaveBeenCalled()
  })

  it('handles empty values for select fields', () => {
    renderForm({
      values: {
        cvdEnrollment: {
          status: 'ENROLLED',
          description: '',
          maxSeverity: '',
          confidentialityRequirement: '',
          integrityRequirement: '',
          availabilityRequirement: '',
        },
      },
      handleChange,
      permission: 'OWNER',
    })
    expect(screen.getByLabelText(/Max Severity/i).value).toBe('')
    expect(screen.getByLabelText(/Confidentiality Requirement/i).value).toBe('')
    expect(screen.getByLabelText(/Integrity Requirement/i).value).toBe('')
    expect(screen.getByLabelText(/Availability Requirement/i).value).toBe('')
  })

  it('does not render additional fields when status is NOT_ENROLLED', () => {
    renderForm({ values: baseValues, handleChange, permission: 'USER' })
    expect(screen.queryByLabelText(/Description/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Max Severity/i)).not.toBeInTheDocument()
  })
})
