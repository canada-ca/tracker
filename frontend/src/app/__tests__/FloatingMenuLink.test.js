// import React from 'react'
// import { render, waitFor } from '@testing-library/react'
// import { theme, ChakraProvider } from '@chakra-ui/react'
// import { I18nProvider } from '@lingui/react'
// import { setupI18n } from '@lingui/core'
// import { MemoryRouter, Route } from 'react-router-dom'
// import { fireEvent } from '@testing-library/dom'
// import { MockedProvider } from '@apollo/client/testing'
// import { makeVar } from '@apollo/client'

// import { FloatingMenuLink } from '../FloatingMenuLink'

// import { UserVarProvider } from '../../utilities/userState'

// const i18n = setupI18n({
//   locale: 'en',
//   messages: {
//     en: {},
//   },
//   localeData: {
//     en: {},
//   },
// })

// describe('<FloatingMenuLink>', () => {
//   it('renders', async () => {
//     const { getByText } = render(
//       <MockedProvider>
//         <UserVarProvider
//           userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
//         >
//           <MemoryRouter initialEntries={['/']}>
//             <I18nProvider i18n={i18n}>
//               <ChakraProvider theme={theme}>
//                 <FloatingMenuLink to="/sign-in" text="Sign In" />
//               </ChakraProvider>
//             </I18nProvider>
//           </MemoryRouter>
//         </UserVarProvider>
//       </MockedProvider>,
//     )
//     await waitFor(() => expect(getByText(/Sign In/i)).toBeInTheDocument())
//   })

//   describe('when the link is clicked', () => {
//     it('redirects', async () => {
//       let wLocation

//       const { getByText } = render(
//         <MockedProvider>
//           <UserVarProvider
//             userVar={makeVar({
//               jwt: null,
//               tfaSendMethod: null,
//               userName: null,
//             })}
//           >
//             <MemoryRouter initialEntries={['/']}>
//               <I18nProvider i18n={i18n}>
//                 <ChakraProvider theme={theme}>
//                   <FloatingMenuLink to="/sign-in" text="Sign In" />
//                   <Route
//                     path="*"
//                     render={({ _history, location }) => {
//                       wLocation = location
//                       return null
//                     }}
//                   />
//                 </ChakraProvider>
//               </I18nProvider>
//             </MemoryRouter>
//           </UserVarProvider>
//         </MockedProvider>,
//       )
//       const signInLink = getByText(/Sign In/i)
//       fireEvent.click(signInLink)

//       await waitFor(() => {
//         expect(wLocation.pathname).toBe('/sign-in')
//       })
//     })
//   })
// })

// //looked at thisimport React from 'react';
import React from 'react'; // Ensure React is imported
import { render, waitFor } from '@testing-library/react';
import { theme, ChakraProvider } from '@chakra-ui/react';
import { I18nProvider } from '@lingui/react';
import { setupI18n } from '@lingui/core';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { fireEvent } from '@testing-library/dom';
import { MockedProvider } from '@apollo/client/testing';
import { makeVar } from '@apollo/client';

import { FloatingMenuLink } from '../FloatingMenuLink';
import { UserVarProvider } from '../../utilities/userState';

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
});

// Custom component to use useLocation hook
const LocationDisplay = ({ setLocation }) => {
  const location = useLocation();
  React.useEffect(() => {
    setLocation(location);
  }, [location, setLocation]);

  return null;
};

describe('<FloatingMenuLink>', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ChakraProvider theme={theme}>
                <FloatingMenuLink to="/sign-in" text="Sign In" />
              </ChakraProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>
    );
    await waitFor(() => expect(getByText(/Sign In/i)).toBeInTheDocument());
  });

  describe('when the link is clicked', () => {
    it('redirects', async () => {
      let wLocation;

      const { getByText } = render(
        <MockedProvider>
          <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
            <MemoryRouter initialEntries={['/']}>
              <I18nProvider i18n={i18n}>
                <ChakraProvider theme={theme}>
                  <FloatingMenuLink to="/sign-in" text="Sign In" />
                  <Routes>
                    <Route
                      path="*"
                      element={<LocationDisplay setLocation={loc => (wLocation = loc)} />}
                    />
                  </Routes>
                </ChakraProvider>
              </I18nProvider>
            </MemoryRouter>
          </UserVarProvider>
        </MockedProvider>
      );

      const signInLink = getByText(/Sign In/i);
      fireEvent.click(signInLink);

      await waitFor(() => {
        expect(wLocation.pathname).toBe('/sign-in');
      });
    });
  });
});
