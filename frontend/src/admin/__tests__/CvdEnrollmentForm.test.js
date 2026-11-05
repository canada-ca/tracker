import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { CvdEnrollmentForm } from '../CvdEnrollmentForm'
import '@testing-library/jest-dom'

describe('<CvdEnrollmentForm>', () => {
  const baseValues = {
    cvdEnrollment: {
      status: 'NOT_ENROLLED',
      description: '',
      reference: '',
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
    renderForm({ values: baseValues, handleChange })
    expect(screen.getAllByText(/CVD Enrollment Status/i)[0]).toBeInTheDocument()
    expect(screen.getByText(/More Info/i)).toBeInTheDocument()
    expect(screen.getByText(/Not Enrolled/i)).toBeInTheDocument()
  })

  it('shows the Enrolled option', () => {
    renderForm({
      values: { cvdEnrollment: { ...baseValues.cvdEnrollment, status: 'ENROLLED' } },
      handleChange,
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
          reference: 'ref',
        },
      },
      handleChange,
    })
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
  })

  it('calls handleChange when status is changed', () => {
    renderForm({ values: baseValues, handleChange })
    // Use getByRole to select by combobox and name
    const select = screen.getByRole('combobox', { name: /CVD Enrollment Status/i })
    fireEvent.change(select, {
      target: { value: 'DENY' },
    })
    expect(handleChange).toHaveBeenCalled()
  })

  it('calls handleChange for description input', () => {
    renderForm({
      values: {
        cvdEnrollment: { ...baseValues.cvdEnrollment, status: 'ENROLLED' },
      },
      handleChange,
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
        },
      },
      handleChange,
    })
    expect(screen.getByLabelText(/Description/i).value).toBe('')
  })

  it('does not render additional fields when status is NOT_ENROLLED', () => {
    renderForm({ values: baseValues, handleChange })
    expect(screen.queryByLabelText(/Description/i)).not.toBeInTheDocument()
  })
})
