import React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { DomainTagsList } from '../DomainTagsList'
import { DOMAIN_TAGS } from '../../graphql/queries'
import { CREATE_TAG, UPDATE_TAG } from '../../graphql/mutations'
import { UserVarProvider } from '../../utilities/userState'
import '@testing-library/jest-dom'

const i18n = setupI18n({
  locale: 'en',
  messages: { en: {} },
  localeData: { en: { plurals: en } },
})

jest.mock('@chakra-ui/react', () => {
  const actual = jest.requireActual('@chakra-ui/react')
  return { ...actual, useToast: () => jest.fn() }
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

jest.mock('../../components/LoadingMessage', () => ({
  LoadingMessage: () => <div data-testid="loading">Loading...</div>,
}))

jest.mock('../../components/ErrorFallbackMessage', () => ({
  ErrorFallbackMessage: () => <div data-testid="error">Error!</div>,
}))

const mockTags = [
  {
    tagId: '1',
    label: 'Important',
    description: 'Critical tag',
    isVisible: true,
    ownership: 'GLOBAL',
    organizations: [],
  },
  {
    tagId: '2',
    label: 'Archived',
    description: 'No longer used',
    isVisible: false, // so visibility icon appears
    ownership: 'ORG',
    organizations: [],
  },
]

const mocks = [
  {
    request: { query: DOMAIN_TAGS, variables: { orgId: undefined, isVisible: true } },
    result: { data: { findAllTags: mockTags } },
  },
  {
    request: {
      query: CREATE_TAG,
      variables: {
        labelEn: '',
        labelFr: '',
        descriptionEn: '',
        descriptionFr: '',
        isVisible: true,
        ownership: '',
      },
    },
    result: {
      data: { createTag: { result: { __typename: 'Tag', tag: 'NewTag' } } },
    },
  },
  {
    request: {
      query: UPDATE_TAG,
      variables: { tagId: '1', labelEn: 'Updated' },
    },
    result: {
      data: { updateTag: { result: { __typename: 'Tag', tagId: '1' } } },
    },
  },
]

const noTagsMocks = [
  {
    request: { query: DOMAIN_TAGS, variables: { orgId: undefined, isVisible: true } },
    result: { data: { findAllTags: [] } },
  },
]

function renderWithProviders(ui, { mocksOverride = [] } = {}) {
  return render(
    <MockedProvider mocks={mocksOverride.length ? mocksOverride : mocks} addTypename={false}>
      <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter>{ui}</MemoryRouter>
          </I18nProvider>
        </ChakraProvider>
      </UserVarProvider>
    </MockedProvider>,
  )
}

describe('DomainTagsList', () => {
  it('renders loading state', () => {
    renderWithProviders(<DomainTagsList />, { mocksOverride: [] })
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('renders error state', async () => {
    const errorMock = [
      {
        request: { query: DOMAIN_TAGS, variables: { orgId: undefined, isVisible: true } },
        error: new Error('GraphQL error: Failed to fetch'),
      },
    ]
    renderWithProviders(<DomainTagsList />, { mocksOverride: errorMock })
    expect(await screen.findByTestId('error')).toBeInTheDocument()
  })

  it('renders tags and allows toggling edit forms', async () => {
    renderWithProviders(<DomainTagsList createOwnership="GLOBAL" />)
    expect(await screen.findByText(/IMPORTANT/i)).toBeInTheDocument()
    expect(screen.getByText(/ARCHIVED/i)).toBeInTheDocument()

    const editButtons = screen.getAllByRole('button', { name: /edit tag/i })
    fireEvent.click(editButtons[0])
    expect(await screen.findAllByText(/visible/i)).not.toHaveLength(0)
  })

  it('opens and closes create form', async () => {
    renderWithProviders(<DomainTagsList />)
    const addTagBtn = await screen.findByRole('button', { name: /Add Tag/i })
    fireEvent.click(addTagBtn)

    const confirmBtn = await screen.findByRole('button', { name: /Confirm/i })
    const closeBtn = screen.getByRole('button', { name: /Close/i })
    fireEvent.click(closeBtn)

    expect(confirmBtn).not.toBeVisible()
  })

  it('shows "No Tags" when none returned', async () => {
    renderWithProviders(<DomainTagsList />, { mocksOverride: noTagsMocks })
    expect(await screen.findByText(/No Tags/i)).toBeInTheDocument()
  })

  it('toggles visibility icon for invisible tags', async () => {
    renderWithProviders(<DomainTagsList />)
    const archivedTag = await screen.findByText(/ARCHIVED/i)
    const icon = within(archivedTag.closest('div')).getByLabelText('tag-invisible')
    expect(icon).toBeInTheDocument()
  })
})
