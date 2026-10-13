import React from 'react'
import { render, screen } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { AdminDomainList } from '../AdminDomainList'

const domainNode = (overrides) => ({
  id: 'domain-id',
  domain: 'test.gc.ca',
  claimTags: [],
  archived: false,
  rcode: 'NOERROR',
  organizations: { totalCount: 1 },
  assetState: 'APPROVED',
  cvdEnrollment: { status: 'NOT_ENROLLED' },
  highAvailability: false,
  orgHasOwnership: false,
  ...overrides,
})

const renderList = (nodes) =>
  render(
    <MockedProvider mocks={[]}>
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <AdminDomainList
            nodes={nodes}
            verified={false}
            permission="ADMIN"
            orgId="org-id"
            setSelectedRemoveProps={jest.fn()}
            removeOnOpen={jest.fn()}
            setModalProps={jest.fn()}
            updateOnOpen={jest.fn()}
          />
        </I18nProvider>
      </ChakraProvider>
    </MockedProvider>,
  )

describe('<AdminDomainList />', () => {
  it('shows the CVD enrollment button only for domains the org owns', () => {
    renderList([
      domainNode({ id: 'owned', domain: 'owned.gc.ca', orgHasOwnership: true }),
      domainNode({ id: 'not-owned', domain: 'other.gc.ca', orgHasOwnership: false }),
    ])

    expect(screen.getByTestId('edit-cvd-0')).toBeInTheDocument()
    expect(screen.queryByTestId('edit-cvd-1')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Edit CVD enrollment/i })).toHaveLength(1)
  })
})
