import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { List, theme, ChakraProvider, ListItem } from '@chakra-ui/react';
import { I18nProvider } from '@lingui/react';
import { MockedProvider } from '@apollo/client/testing';
import { setupI18n } from '@lingui/core';
import { en } from 'make-plural/plurals';
import { OrganizationCard } from '../OrganizationCard';
import { matchMediaSize } from '../../helpers/matchMedia';

matchMediaSize();

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
});

// Adjusted summaries structure
const summaries = {
  https: {
    categories: [
      { name: 'pass', percentage: 75 }, // Example data
    ],
  },
  dmarc: {
    categories: [
      { name: 'pass', percentage: 80 }, // Example data
    ],
  },
};

describe('<OrganizationCard />', () => {
  it('successfully renders card with org name and number of services', async () => {
    const { getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/organizations/tbs-sct-gc-ca']}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <Routes>
                <Route path="/organizations/:slug" element={
                  <List>
                    <ListItem>
                      <OrganizationCard
                        slug="tbs-sct-gc-ca"
                        name="Treasury Board Secretariat"
                        acronym="TBS"
                        domainCount={7}
                        verified={false}
                        summaries={summaries}
                      />
                    </ListItem>
                  </List>
                } />
              </Routes>
            </I18nProvider>
          </ChakraProvider>
        </MemoryRouter>
      </MockedProvider>
    );

    const orgName = getByText(/Treasury Board Secretariat/i);
    expect(orgName).toBeDefined();

    const domainCount = getByText(/Services: 7/i);
    expect(domainCount).toBeDefined();
    
    const httpsConfigured = getByText(/HTTPS Configured/i);
    expect(httpsConfigured).toBeDefined();

    const dmarcConfigured = getByText(/DMARC Configured/i);
    expect(dmarcConfigured).toBeDefined();
  });
});