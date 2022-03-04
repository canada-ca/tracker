import React from 'react'
// import trackerLogo from '../images/trackerlogo.svg'
import {
  // Link,
  // Box,
  // Divider,
  // Grid,
  // Image,
  Stack,
  // Text,
  Heading,
} from '@chakra-ui/react'
import { Trans } from '@lingui/macro'

// import { useLingui } from '@lingui/react'
import { LandingPageSummaries } from './LandingPageSummaries'

// const emailUrlEn = 'https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=27600'
// const itpinUrlEn =
//   'https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html'
// const emailUrlFr = 'https://www.tbs-sct.gc.ca/pol/doc-fra.aspx?id=27600'
// const itpinUrlFr =
//   'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/technologiques-modernes-nouveaux/avis-mise-oeuvre-politique/mise-oeuvre-https-connexions-web-securisees-ampti.html'

export function LandingPage() {
  // const { i18n } = useLingui()
  return (
    <Stack w="100%" px="4">
      <Heading as="h1" mb="16" textAlign="left">
        <Trans>Track Digital Security</Trans>
      </Heading>
      {/* <Grid
        bg="primary"
        height="fit-content"
        templateAreas={{ sm: 'welcome', md: 'welcome logo' }}
        templateColumns={{ sm: '1fr', md: '1fr 1fr' }}
      >
        <Box mx="10" my="10">
          <Text
            fontSize={{ base: '2xl', lg: '3xl', xl: '4xl' }}
            fontWeight="semibold"
            color="white"
          >
            <Trans>Track Digital Security</Trans>
          </Text>
          <Divider borderColor="accent" my={2} borderTopWidth="2" w="20%" />
          <Text color="white" fontSize={{ base: 'sm', lg: 'lg', xl: 'xl' }}>
            <Trans>
              Canadians rely on the Government of Canada to provide secure
              digital services. The Policy on Service and Digital guides
              government online services to adopt good security practices for
              practices outlined in the{' '}
              <Link
                href={i18n.locale === 'en' ? emailUrlEn : emailUrlFr}
                isExternal
                style={{ textDecoration: 'underline', fontWeight: 'bold' }}
              >
                email
              </Link>{' '}
              and{' '}
              <Link
                href={i18n.locale === 'en' ? itpinUrlEn : itpinUrlFr}
                isExternal
                style={{ textDecoration: 'underline', fontWeight: 'bold' }}
              >
                web
              </Link>{' '}
              services. Track how government sites are becoming more secure.
            </Trans>
          </Text>
        </Box>
        <Box
          display={{ base: 'none', md: 'flex' }}
          bg="primary"
          justifyContent="center"
        >
          <Image
            bg="white"
            p="2em"
            src={trackerLogo}
            alt={'Tracker Logo'}
            width="auto"
            height={{ md: '80%', lg: '87%' }}
            alignSelf="center"
          />
        </Box>
      </Grid> */}
      {document.location.origin !== 'https://tracker.alpha.canada.ca' && (
        <LandingPageSummaries />
      )}
    </Stack>
  )
}
