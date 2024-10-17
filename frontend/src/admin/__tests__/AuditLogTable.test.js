import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { AuditLogTable } from '../AuditLogTable'
import { waitFor, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'
import userEvent from '@testing-library/user-event'

import { UserVarProvider } from '../../utilities/userState'
import { AUDIT_LOGS } from '../../graphql/queries'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

describe('<AuditLogTable />', () => {
  it('shows a table displaying activity logs from organizations', async () => {
    const { queryByText } = render(
      <MockedProvider mocks={mocks()} addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <I18nProvider i18n={i18n}>
            <ChakraProvider theme={theme}>
              <MemoryRouter initialEntries={['/admin/audit-logs']} initialIndex={0}>
                <AuditLogTable />
              </MemoryRouter>
            </ChakraProvider>
          </I18nProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(queryByText(/Updated Properties/i)).toBeInTheDocument()
    })
  })
  // pagination

  // search

  // filters
  describe('with filtering options', () => {
    it('filters logs by user resource, add action', async () => {
      const { queryByText, getByRole, getByText } = render(
        <MockedProvider mocks={mocks()} addTypename={false}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <I18nProvider i18n={i18n}>
              <ChakraProvider theme={theme}>
                <MemoryRouter initialEntries={['/admin/audit-logs']} initialIndex={0}>
                  <AuditLogTable />
                </MemoryRouter>
              </ChakraProvider>
            </I18nProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => {
        expect(queryByText(/Updated Properties/i)).toBeInTheDocument()
      })
      const userTimestamp = getByText('2022-10-12, 17:56')
      const domainTimestamp = getByText('2022-11-12, 17:56')
      const orgTimestamp = getByText('2022-15-12, 17:56')

      await waitFor(() => {
        expect(userTimestamp).toBeInTheDocument()
        expect(domainTimestamp).toBeInTheDocument()
        expect(orgTimestamp).toBeInTheDocument()
      })

      const userFilter = getByRole('button', { name: 'User' })
      const addFilter = getByRole('button', { name: 'Add' })
      userEvent.click(userFilter)
      userEvent.click(addFilter)

      await waitFor(() => {
        expect(domainTimestamp).not.toBeInTheDocument()
        expect(orgTimestamp).not.toBeInTheDocument()
      })
    })
    it('filters logs by domain resource, remove action', async () => {
      const { queryByText, getByRole, getByText } = render(
        <MockedProvider mocks={mocks()} addTypename={false}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <I18nProvider i18n={i18n}>
              <ChakraProvider theme={theme}>
                <MemoryRouter initialEntries={['/admin/audit-logs']} initialIndex={0}>
                  <AuditLogTable />
                </MemoryRouter>
              </ChakraProvider>
            </I18nProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => {
        expect(queryByText(/Updated Properties/i)).toBeInTheDocument()
      })
      const userTimestamp = getByText('2022-10-12, 17:56')
      const domainTimestamp = getByText('2022-11-12, 17:56')
      const orgTimestamp = getByText('2022-15-12, 17:56')

      await waitFor(() => {
        expect(userTimestamp).toBeInTheDocument()
        expect(domainTimestamp).toBeInTheDocument()
        expect(orgTimestamp).toBeInTheDocument()
      })

      const domainFilter = getByRole('button', { name: 'Domain' })
      const removeFilter = getByRole('button', { name: 'Remove' })
      userEvent.click(domainFilter)
      userEvent.click(removeFilter)

      await waitFor(() => {
        expect(userTimestamp).not.toBeInTheDocument()
        // expect(domainTimestamp).toBeInTheDocument()
        expect(orgTimestamp).not.toBeInTheDocument()
      })
    })
    it('filters logs by org resource, update action', async () => {
      const { queryByText, getByRole, getByText } = render(
        <MockedProvider mocks={mocks()} addTypename={false}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <I18nProvider i18n={i18n}>
              <ChakraProvider theme={theme}>
                <MemoryRouter initialEntries={['/admin/audit-logs']} initialIndex={0}>
                  <AuditLogTable />
                </MemoryRouter>
              </ChakraProvider>
            </I18nProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => {
        expect(queryByText(/Updated Properties/i)).toBeInTheDocument()
      })
      const userTimestamp = getByText('2022-10-12, 17:56')
      const domainTimestamp = getByText('2022-11-12, 17:56')
      const orgTimestamp = getByText('2022-15-12, 17:56')

      await waitFor(() => {
        expect(userTimestamp).toBeInTheDocument()
        expect(domainTimestamp).toBeInTheDocument()
        expect(orgTimestamp).toBeInTheDocument()
      })

      const orgFilter = getByRole('button', { name: 'Organization' })
      const updateFilter = getByRole('button', { name: 'Update' })
      userEvent.click(orgFilter)
      userEvent.click(updateFilter)

      await waitFor(() => {
        expect(userTimestamp).not.toBeInTheDocument()
        expect(domainTimestamp).not.toBeInTheDocument()
        // expect(orgTimestamp).toBeInTheDocument()
      })
      userEvent.click(orgFilter)
      const clearBtn = getByRole('button', { name: 'Clear' })
      userEvent.click(clearBtn)
    })
  })
})

function mocks() {
  return [
    {
      request: {
        query: AUDIT_LOGS,
        variables: {
          first: 50,
          orderBy: {
            field: 'TIMESTAMP',
            direction: 'DESC',
          },
          orgId: null,
          search: '',
          filters: { resource: [], action: [] },
        },
      },
      result: {
        data: {
          findAuditLogs: {
            edges: [
              {
                node: {
                  id: '3358872e-fbfa-4c73-b266-df96397f58c3',
                  timestamp: '2022-10-12T17:56:46.306Z',
                  initiatedBy: {
                    id: 'fb311e39-6404-4778-a4eb-9afc5a699920',
                    userName: 'super@user1',
                    role: 'Hello World',
                    organization: 'Hello World',
                  },
                  action: 'add',
                  target: {
                    resource: 'test@user.ca',
                    organization: {
                      name: 'Hello World',
                    },
                    resourceType: 'user',
                    updatedProperties: [],
                  },
                  reason: '',
                },
              },
              {
                node: {
                  id: '2e266fe9-34de-4443-a249-baad8bdbe341',
                  timestamp: '2022-11-12T17:56:46.306Z',
                  initiatedBy: {
                    id: '265d950a-2758-44ae-8752-b5db5aae4276',
                    userName: 'super@user2',
                    role: 'Hello World',
                    organization: 'Hello World',
                  },
                  action: 'remove',
                  target: {
                    resource: 'old.domain.ca',
                    organization: {
                      name: 'Hello World',
                    },
                    resourceType: 'domain',
                    updatedProperties: [],
                  },
                  reason: 'nonexistent',
                },
              },
              {
                node: {
                  id: '2e266fe9-34de-4443-a249-baad8bdbe3',
                  timestamp: '2022-15-12T17:56:46.306Z',
                  initiatedBy: {
                    id: '265d950a-2758-44ae-8752-b5db5aae4276',
                    userName: 'super@user3',
                    role: 'Hello World',
                    organization: 'Hello World',
                  },
                  action: 'update',
                  target: {
                    resource: 'my org 1',
                    organization: {
                      name: 'Hello World',
                    },
                    updatedProperties: [
                      {
                        name: 'cityEN',
                        oldValue: 'oldCity',
                        newValue: 'newCity',
                      },
                    ],
                    resourceType: 'organization',
                  },
                  reason: '',
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'Hello World',
              endCursor: 'Hello World',
            },
          },
        },
      },
    },
    {
      request: {
        query: AUDIT_LOGS,
        variables: {
          first: 50,
          orderBy: {
            field: 'TIMESTAMP',
            direction: 'DESC',
          },
          orgId: null,
          search: '',
          filters: { resource: ['DOMAIN'], action: ['REMOVE'] },
        },
      },
      result: {
        data: {
          findAuditLogs: {
            edges: [
              {
                node: {
                  id: '2e266fe9-34de-4443-a249-baad8bdbe',
                  timestamp: '2022-11-12T17:56:46.306Z',
                  initiatedBy: {
                    id: '265d950a-2758-44ae-8752-b5db5aae4276',
                    userName: 'super@user2',
                    role: 'Hello World',
                    organization: 'Hello World',
                  },
                  action: 'remove',
                  target: {
                    resource: 'old.domain.ca',
                    organization: {
                      name: 'Hello World',
                    },
                    resourceType: 'domain',
                    updatedProperties: [],
                  },
                  reason: 'nonexistent',
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'Hello World',
              endCursor: 'Hello World',
            },
          },
        },
      },
    },
    {
      request: {
        query: AUDIT_LOGS,
        variables: {
          first: 50,
          orderBy: {
            field: 'TIMESTAMP',
            direction: 'DESC',
          },
          orgId: null,
          search: '',
          filters: { resource: ['USER'], action: ['ADD'] },
        },
      },
      result: {
        data: {
          findAuditLogs: {
            edges: [
              {
                node: {
                  id: '3358872e-fbfa-4c73-b266-df96397f58c3',
                  timestamp: '2022-10-12T17:56:46.306Z',
                  initiatedBy: {
                    id: 'fb311e39-6404-4778-a4eb-9afc5a699920',
                    userName: 'super@user1',
                    role: 'Hello World',
                    organization: 'Hello World',
                  },
                  action: 'add',
                  target: {
                    resource: 'test@user.ca',
                    organization: {
                      name: 'Hello World',
                    },
                    resourceType: 'user',
                    updatedProperties: [],
                  },
                  reason: '',
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'Hello World',
              endCursor: 'Hello World',
            },
          },
        },
      },
    },
    {
      request: {
        query: AUDIT_LOGS,
        variables: {
          first: 50,
          orderBy: {
            field: 'TIMESTAMP',
            direction: 'DESC',
          },
          orgId: null,
          search: '',
          filters: { resource: ['ORGANIZATION'], action: ['UPDATE'] },
        },
      },
      result: {
        data: {
          findAuditLogs: {
            edges: [
              {
                node: {
                  id: '2e266fe9-34de-4443-a249-baad8bdbe34',
                  timestamp: '2022-15-12T17:56:46.306Z',
                  initiatedBy: {
                    id: '265d950a-2758-44ae-8752-b5db5aae4276',
                    userName: 'super@user3',
                    role: 'Hello World',
                    organization: 'Hello World',
                  },
                  action: 'update',
                  target: {
                    resource: 'my org 1',
                    organization: {
                      name: 'Hello World',
                    },
                    updatedProperties: [
                      {
                        name: 'cityEN',
                        oldValue: 'oldCity',
                        newValue: 'newCity',
                      },
                    ],
                    resourceType: 'organization',
                  },
                  reason: '',
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'Hello World',
              endCursor: 'Hello World',
            },
          },
        },
      },
    },
  ]
}
