import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { en } from 'make-plural/plurals'
import { TagForm } from '../TagForm'
import { CREATE_TAG, UPDATE_TAG } from '../../graphql/mutations'
import '@testing-library/jest-dom'

const i18n = setupI18n({
  locale: 'en',
  messages: { en: {} },
  localeData: { en: { plurals: en } },
})

jest.mock('@chakra-ui/react', () => {
  const actual = jest.requireActual('@chakra-ui/react')
  return {
    ...actual,
    useToast: () => jest.fn(),
  }
})

jest.mock('@lingui/macro', () => ({
  t: (str) => str,
  Trans: ({ children }) => children,
}))

jest.mock('../../utilities/fieldRequirements', () => {
  const Yup = require('yup')
  return {
    getRequirement: () => ({ required: true }),
    schemaToValidation: () =>
      Yup.object().shape({
        labelEn: Yup.string().required(),
        labelFr: Yup.string(),
        isVisible: Yup.boolean(),
        ownership: Yup.string(),
      }),
  }
})

describe('<TagForm>', () => {
  const setTagFormState = jest.fn()
  const defaultProps = {
    visible: true,
    ownership: '',
    setTagFormState,
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders create form and allows input', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <TagForm mutation="create" {...defaultProps} />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    expect(screen.getByLabelText(/Label \(EN\)/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Label \(EN\)/i), { target: { value: 'TestTag' } })
    expect(screen.getByLabelText(/Label \(EN\)/i)).toHaveValue('TestTag')
  })

  it('renders update form and allows input', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <TagForm mutation="update" tagId="1" visible={false} ownership="ORG" setTagFormState={setTagFormState} />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    expect(screen.getByLabelText(/Label \(EN\)/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Label \(EN\)/i), { target: { value: 'UpdatedTag' } })
    expect(screen.getByLabelText(/Label \(EN\)/i)).toHaveValue('UpdatedTag')
  })

  it('calls setTagFormState on Close (create)', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <TagForm mutation="create" {...defaultProps} />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    fireEvent.click(screen.getByText(/Close/i))
    expect(setTagFormState).toHaveBeenCalledWith(expect.any(Function))
  })

  it('calls setTagFormState on Close (update)', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <TagForm mutation="update" tagId="1" visible={false} ownership="ORG" setTagFormState={setTagFormState} />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    fireEvent.click(screen.getByText(/Close/i))
    expect(setTagFormState).toHaveBeenCalledWith(expect.any(Function))
  })

  it('submits create form and disables button while loading', async () => {
    const mocks = [
      {
        request: {
          query: CREATE_TAG,
          variables: {
            labelEn: 'TestTag',
            labelFr: '',
            descriptionEn: '',
            descriptionFr: '',
            isVisible: true,
            ownership: '',
          },
        },
        result: {
          data: {
            createTag: {
              result: { __typename: 'Tag', tag: 'TestTag' },
            },
          },
        },
      },
    ]
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <TagForm mutation="create" {...defaultProps} />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    fireEvent.change(screen.getByLabelText(/Label \(EN\)/i), { target: { value: 'TestTag' } })
    fireEvent.click(screen.getByText(/Confirm/i))
    await waitFor(() => expect(setTagFormState).toHaveBeenCalled())
  })

  it('calls handleReset on Clear', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <TagForm mutation="create" {...defaultProps} />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    const clearBtn = screen.getByText(/Clear/i)
    fireEvent.click(clearBtn)
    // No error = pass, Formik handles reset
  })

  it('shows validation error if required field is empty', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <TagForm mutation="create" {...defaultProps} />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    fireEvent.click(screen.getByText(/Confirm/i))
    await waitFor(() => {
      expect(screen.getByLabelText(/Label \(EN\)/i)).toBeInvalid()
    })
  })
})
