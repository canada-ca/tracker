import React from 'react'
import { Box, Divider, Heading, Link, Stack, Text } from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Trans } from '@lingui/macro'

import { LandingPageSummaries } from './LandingPageSummaries'
import { useLingui } from '@lingui/react'
import { bool } from 'prop-types'
import { TourComponent } from '../userOnboarding/components/TourComponent'

const emailUrlEn =
  'https://www.canada.ca/en/government/system/digital-government/policies-standards/enterprise-it-service-common-configurations/email.html'
const itpinUrlEn =
  'https://www.canada.ca/en/government/system/digital-government/policies-standards/enterprise-it-service-common-configurations/web-sites.html'
const emailUrlFr =
  'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/politiques-normes/configurations-courantes-services-ti-integree/courriels.html'
const itpinUrlFr =
  'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/politiques-normes/configurations-courantes-services-ti-integree/sites-web.html'

export function LandingPage({ loginRequired, isLoggedIn }) {
  const { i18n } = useLingui()

  return (
    <Stack w="100%">
      <TourComponent page="landingPage" />
      <Box mb="16" textAlign="left" px="4">
        <Heading as="h1">
          <Trans>Track Digital Security</Trans>
        </Heading>
        <Divider borderColor="black" my="2" borderTopWidth="1" w="auto" />
        <Text fontSize="xl">
          <Trans>
            Canadians rely on the Government of Canada to provide secure digital services. The Policy on Service and
            Digital guides government online services to adopt good security practices for practices outlined in the{' '}
            <Link
              href={i18n.locale === 'en' ? emailUrlEn : emailUrlFr}
              isExternal
              style={{ fontWeight: 'bold', textAlign: 'center' }}
            >
              email
              <ExternalLinkIcon />
            </Link>{' '}
            and{' '}
            <Link
              href={i18n.locale === 'en' ? itpinUrlEn : itpinUrlFr}
              isExternal
              style={{ fontWeight: 'bold', textAlign: 'center' }}
            >
              web
              <ExternalLinkIcon />
            </Link>{' '}
            services. Track how government sites are becoming more secure.
          </Trans>
        </Text>
      </Box>
      {(!loginRequired || isLoggedIn) && <LandingPageSummaries />}
    </Stack>
  )
}

LandingPage.propTypes = {
  loginRequired: bool,
  isLoggedIn: bool,
}
