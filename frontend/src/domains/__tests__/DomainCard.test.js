import React from 'react'
import { render, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { List, theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { i18n } from '@lingui/core'
import { DomainCard } from '../DomainCard'
import { UserVarProvider } from '../../utilities/userState'
import { makeVar } from '@apollo/client'

const status = {
  policy: 'pass',
  ciphers: 'pass',
  curves: 'pass',
  dkim: 'pass',
  dmarc: 'pass',
  hsts: 'pass',
  https: 'pass',
  protocols: 'pass',
  spf: 'pass',
  ssl: 'pass',
}

const vulnerableResult = {
  status: 'VULNERABLE',
  version: 'PHP/8.1.2-1ubuntu2.19',
  advisories: ['AL26-026'],
  cves: ['CVE-2026-109618', 'CVE-2026-109619'],
  evidence: ['X-Powered-By: PHP/8.1.2-1ubuntu2.19'],
}

const unknownVersionResult = {
  status: 'UNKNOWN_VERSION',
  version: null,
  advisories: [],
  cves: [],
  evidence: ['PHPSESSID cookie'],
}

const notAffectedResult = {
  status: 'NOT_AFFECTED',
  version: 'PHP/8.4.27',
  advisories: [],
  cves: [],
  evidence: ['X-Powered-By: PHP/8.4.27'],
}

describe('<DomainCard />', () => {
  it('successfully renders card with domain name', async () => {
    const { getByText } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <MemoryRouter initialEntries={['/']}>
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <List>
                  <DomainCard
                    url="tbs-sct.gc.ca"
                    status={status}
                    hasDMARCReport={true}
                  />
                </List>
              </I18nProvider>
            </ChakraProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )

    const domain = getByText(/tbs-sct.gc.ca/i)
    expect(domain).toBeDefined()
  })

  it('shows super admins one PHP tag for the PHP status', async () => {
    const { getAllByRole } = render(
      <MockedProvider>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <List>
                  <DomainCard url="vulnerable.gc.ca" status={status} isSuperAdmin={true} phpResult={vulnerableResult} />
                  <DomainCard
                    url="unknown-version.gc.ca"
                    status={status}
                    isSuperAdmin={true}
                    phpResult={unknownVersionResult}
                  />
                  <DomainCard
                    url="not-affected.gc.ca"
                    status={status}
                    isSuperAdmin={true}
                    phpResult={notAffectedResult}
                  />
                  <DomainCard
                    url="not-super-admin.gc.ca"
                    status={status}
                    isSuperAdmin={false}
                    phpResult={vulnerableResult}
                  />
                  <DomainCard url="no-php.gc.ca" status={status} isSuperAdmin={true} phpResult={null} />
                </List>
              </I18nProvider>
            </ChakraProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )

    const phpTagsByDomain = Object.fromEntries(
      getAllByRole('listitem').map((card) => [
        within(card).getByText(/\.gc\.ca$/).textContent,
        within(card)
          .queryAllByText(/^PHP/)
          .map((tag) => tag.textContent),
      ]),
    )
    expect(phpTagsByDomain).toEqual({
      'vulnerable.gc.ca': ['PHP: vulnerable'],
      'unknown-version.gc.ca': ['PHP: unknown version'],
      'not-affected.gc.ca': ['PHP: not affected'],
      'not-super-admin.gc.ca': [],
      'no-php.gc.ca': [],
    })
  })
})
