import React from 'react'
import { Box, Divider, Heading, Link, Stack, Text } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'

import { LandingPageSummaries } from './LandingPageSummaries'
import { useLingui } from '@lingui/react'
import { bool } from 'prop-types'
import { useQuery } from '@apollo/client'
import { IS_USER_SUPER_ADMIN } from '../graphql/queries'

const emailUrlEn = 'https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=27600'
const itpinUrlEn =
  'https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html'
const emailUrlFr = 'https://www.tbs-sct.gc.ca/pol/doc-fra.aspx?id=27600'
const itpinUrlFr =
  'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/technologiques-modernes-nouveaux/avis-mise-oeuvre-politique/mise-oeuvre-https-connexions-web-securisees-ampti.html'

export function LandingPage({ isLoggedIn }) {
  const { i18n } = useLingui()
  const { _loading, _error, data } = useQuery(IS_USER_SUPER_ADMIN)
  console.log(data)
  return (
    <Stack w="100%">
      <Box mb="16" textAlign="left" px="4">
        <Heading as="h1">
          <Trans>Track Digital Security</Trans>
        </Heading>
        <Divider borderColor="black" my="2" borderTopWidth="1" w="auto" />
        <Text fontSize="xl">
          <Trans>
            Canadians rely on the Government of Canada to provide secure digital
            services. The Policy on Service and Digital guides government online
            services to adopt good security practices for practices outlined in
            the{' '}
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
      {(!document.location.origin.match(/(suivi|tracker).alpha.canada.ca$/) ||
        (isLoggedIn && data?.isUserSuperAdmin)) && <LandingPageSummaries />}
    </Stack>
  )
}

LandingPage.propTypes = {
  isLoggedIn: bool,
}
