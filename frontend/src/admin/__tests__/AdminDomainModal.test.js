import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'
import { AdminDomainModal } from '../AdminDomainModal'
import { createCache } from '../../client'
import { UserVarProvider } from '../../utilities/userState'
import { UPDATE_DOMAIN } from '../../graphql/mutations'

const domainId = 'testid2='
const orgId = 'testid='

const updateDomainMock = (variables) => ({
  request: {
    query: UPDATE_DOMAIN,
    variables,
  },
  result: {
    data: {
      updateDomain: {
        result: {
          id: domainId,
          domain: 'test.gc.ca',
          __typename: 'Domain',
        },
        __typename: 'UpdateDomainPayload',
      },
    },
  },
})

const renderModal = ({ mocks = [], ...props }) =>
  render(
    <MockedProvider mocks={mocks} cache={createCache()}>
      <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']}>
              <AdminDomainModal
                isOpen={true}
                onClose={jest.fn()}
                orgId={orgId}
                orgSlug="test-org.slug"
                availableTags={[]}
                tagInputList={[]}
                editingDomainId={domainId}
                editingDomainUrl="test.gc.ca"
                assetState="APPROVED"
                permission="ADMIN"
                {...props}
              />
            </MemoryRouter>
          </I18nProvider>
        </ChakraProvider>
      </UserVarProvider>
    </MockedProvider>,
  )

describe('<AdminDomainModal />', () => {
  describe('submitting an update', () => {
    it('sends update variables without any cvdEnrollment field', async () => {
      const mocks = [updateDomainMock({ domainId, orgId, tags: [], assetState: 'APPROVED' })]

      renderModal({ mocks, mutation: 'update' })

      await waitFor(() => expect(screen.getByText(/Edit Domain Details/i)).toBeInTheDocument())
      fireEvent.click(screen.getByText('Confirm'))

      await waitFor(() => expect(screen.getByText(/Domain updated/)).toBeInTheDocument())
    })

    it('does not render a CVD enrollment form', async () => {
      renderModal({ mutation: 'update' })

      await waitFor(() => expect(screen.getByText(/Edit Domain Details/i)).toBeInTheDocument())
      expect(screen.queryByRole('combobox', { name: /CVD Enrollment Status/i })).not.toBeInTheDocument()
    })
  })
})
