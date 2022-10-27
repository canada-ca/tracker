import React from 'react'
import { Trans } from '@lingui/macro'
import {
  Box,
  Divider,
  Heading,
  Text,
  Link,
  ListItem,
  OrderedList,
  UnorderedList,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import { useLingui } from '@lingui/react'

export default function ReadGuidancePage() {
  const { i18n } = useLingui()

  return (
    <Box w="100%" p="4">
      <Tabs variant="enclosed-colored">
        <TabList mb="4">
          <Tab borderTopWidth="4px">
            <Trans>Guidance</Trans>
          </Tab>
          <Tab borderTopWidth="4px">
            <Trans>FAQ</Trans>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {' '}
            <Heading>
              <Trans>Read Guidance</Trans>
            </Heading>
            <Divider borderBottomColor="gray.900" mb="2" />
            <Text fontSize="xl">
              <Trans>
                The Government of Canada’s (GC){' '}
                <Link
                  color="blue.500"
                  href={
                    i18n.locale === 'en'
                      ? 'https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=32601'
                      : 'https://www.tbs-sct.canada.ca/pol/doc-fra.aspx?id=32601'
                  }
                >
                  Directive on Service and Digital
                </Link>{' '}
                provides expectations on how GC organizations are to manage
                their Information Technology (IT) services. The focus of the
                Tracker tool is to help organizations stay in compliance with
                the directives{' '}
                <Link
                  color="blue.500"
                  href={
                    i18n.locale === 'en'
                      ? 'https://www.canada.ca/en/government/system/digital-government/policies-standards/enterprise-it-service-common-configurations/email.html'
                      : 'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/politiques-normes/configurations-courantes-services-ti-integree/courriels.html'
                  }
                >
                  Email Management Service Configuration Requirements
                </Link>{' '}
                and the directives{' '}
                <Link
                  color="blue.500"
                  href={
                    i18n.locale === 'en'
                      ? 'https://www.canada.ca/en/government/system/digital-government/policies-standards/enterprise-it-service-common-configurations/web-sites.html'
                      : 'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/politiques-normes/configurations-courantes-services-ti-integree/sites-web.html'
                  }
                >
                  Web Site and Service Management Configuration Requirements
                </Link>
                .
              </Trans>
            </Text>
            <Text mt="4" fontSize="xl">
              <Trans>
                Below are steps on how government organizations can leverage the
                Tracker platform:
              </Trans>
            </Text>
            <OrderedList fontSize="xl" px="8" pb="8" spacing="4">
              {/* 1 */}
              <ListItem>
                <Trans>
                  Identify resources required to act as central point(s) of
                  contact with Treasury Board of Canada Secretariat (TBS). Share
                  the contact list with{' '}
                  <Link
                    href="mailto:zzTBSCybers@tbs-sct.gc.ca"
                    color="blue.500"
                  >
                    TBS Cyber Security
                  </Link>
                  , as required.
                </Trans>
              </ListItem>
              {/* 2 */}
              <ListItem>
                <Trans>
                  Perform an inventory of all organizational domains and
                  subdomains. Sources of information include:
                </Trans>
                <UnorderedList>
                  <ListItem>
                    <Trans>
                      The{' '}
                      <Link href="https://tracker.canada.ca/" color="blue.500">
                        Tracker
                      </Link>{' '}
                      platform
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      Application Portfolio Management (APM) systems; and
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>Business units within your organization.</Trans>
                  </ListItem>
                </UnorderedList>
              </ListItem>
              {/* 3 */}
              <ListItem>
                <Trans>
                  Provide an up-to-date list of all domain and sub-domains of
                  publicly accessible websites and web services to TBS Cyber
                  Security. The TBS Cyber Security team is responsible for
                  updating the domain and sub-domain lists within Tracker.
                </Trans>
              </ListItem>
              {/* 4 */}
              <ListItem>
                <Trans>
                  Use Tracker and{' '}
                  <Link
                    href="http://ITSP.40.062/transport-layer-security/tls-guidance.json"
                    color="blue.500"
                  >
                    ITSP.40.062 Transport Layer Security (TLS) guidance
                  </Link>{' '}
                  to monitor the domains and sub-domains of your organization.
                  Other tools available to support this activity include,{' '}
                  <Link
                    href="https://www.ssllabs.com/ssltest/"
                    color="blue.500"
                  >
                    SSL Labs
                  </Link>
                  ,{' '}
                  <Link href="https://www.hardenize.com/" color="blue.500">
                    Hardenize
                  </Link>
                  ,{' '}
                  <Link href="https://www.sslshopper.com/" color="blue.500">
                    SSLShopper
                  </Link>
                  , etc..
                </Trans>
                <UnorderedList>
                  <ListItem>
                    <Trans>Tracker results refresh every 24 hours.</Trans>
                  </ListItem>
                </UnorderedList>
              </ListItem>
              {/* 5 */}
              <ListItem>
                <Trans>
                  Develop a prioritized schedule to address any failings.
                  Consider prioritizing websites and web services that exchange
                  Protected data.
                </Trans>
                <UnorderedList>
                  <ListItem>
                    <Trans>
                      Where necessary adjust IT Plans and budget estimates where
                      work is expected.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      It is recommended that Shared Service Canada (SSC)
                      partners contact their SSC Service Delivery Manager to
                      discuss action plans and required steps to submit a
                      request for change.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      Obtain certificates from a GC-approved certificate source
                      as outlined in the Recommendations for TLS Server
                      Certificates for GC public facing web services
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      Obtain the configuration guidance for the appropriate
                      endpoints (e.g., web server, network/security appliances,
                      etc.) and implement recommended configurations.
                    </Trans>
                  </ListItem>
                </UnorderedList>
              </ListItem>
            </OrderedList>
          </TabPanel>
          <TabPanel>
            <Heading>
              <Trans>Frequently Asked Questions</Trans>
            </Heading>
            <Divider borderBottomColor="gray.900" mb="2" />
            <OrderedList fontSize="xl" px="8" pb="8" spacing="4">
              {/* 1 */}
              <ListItem>
                <Trans>It is not clear to me why a domain has failed?</Trans>
                <UnorderedList>
                  <ListItem>
                    <Trans>
                      Please contact{' '}
                      <Link
                        href="mailto:zzTBSCybers@tbs-sct.gc.ca"
                        color="blue.500"
                      >
                        TBS Cyber Security
                      </Link>{' '}
                      for help.
                    </Trans>
                  </ListItem>
                </UnorderedList>
              </ListItem>
              {/* 2 */}
              <ListItem>
                <Trans>How can I edit my domain list?</Trans>
                <UnorderedList>
                  <ListItem>
                    <Trans>
                      Please direct all updates to TBS Cyber Security.
                    </Trans>
                  </ListItem>
                </UnorderedList>
              </ListItem>
              {/* 3 */}
              <ListItem>
                <Trans>
                  Why do other tools (
                  <Link href="https://www.hardenize.com/" color="blue.500">
                    Hardenize
                  </Link>
                  ,{' '}
                  <Link
                    href="https://www.ssllabs.com/ssltest/"
                    color="blue.500"
                  >
                    SSL Labs
                  </Link>
                  , etc.) show positive results for a domain while Tracker shows
                  negative results?
                </Trans>
                <UnorderedList>
                  <ListItem>
                    <Trans>
                      While other tools are useful to work alongside Tracker,
                      they do not specifically adhere to the configuration
                      requirements specified in the{' '}
                      <Link
                        color="blue.500"
                        href={
                          i18n.locale === 'en'
                            ? 'https://www.canada.ca/en/government/system/digital-government/policies-standards/enterprise-it-service-common-configurations/email.html'
                            : 'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/politiques-normes/configurations-courantes-services-ti-integree/courriels.html'
                        }
                      >
                        Email Management Service Configuration Requirements
                      </Link>{' '}
                      and the{' '}
                      <Link
                        color="blue.500"
                        href={
                          i18n.locale === 'en'
                            ? 'https://www.canada.ca/en/government/system/digital-government/policies-standards/enterprise-it-service-common-configurations/web-sites.html'
                            : 'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/politiques-normes/configurations-courantes-services-ti-integree/sites-web.html'
                        }
                      >
                        Web Site and Service Management Configuration
                        Requirements
                      </Link>
                      . For a list of allowed protocols, ciphers, and curves
                      review the{' '}
                      <Link
                        color="blue.500"
                        href="http://ITSP.40.062/transport-layer-security/tls-guidance.json"
                      >
                        ITSP.40.062 TLS guidance
                      </Link>
                      .
                    </Trans>
                  </ListItem>
                </UnorderedList>
              </ListItem>
              {/* 4 */}
              <ListItem>
                <Text>
                  <Trans>What does it mean if a domain is “unreachable”?</Trans>
                </Text>
                <UnorderedList>
                  <ListItem>
                    <Trans>
                      By default our scanners check domains ending in “.gc.ca”
                      and “.canada.ca”. If your domain is outside that set, you
                      need to contact us to let us know. Send an email to TBS
                      Cyber Security to confirm your ownership of that domain.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      Another possibility is that your domain is not internet
                      facing.
                    </Trans>
                  </ListItem>
                </UnorderedList>
              </ListItem>
              <ListItem>
                <Trans>Where can I get a GC-approved TLS certificate?</Trans>
                <UnorderedList>
                  <ListItem>
                    <Trans>
                      Options include contacting the{' '}
                      <Link href="mailto:ssltls@ssc-spc.gc.ca" color="blue.500">
                        SSC WebSSL services team
                      </Link>{' '}
                      and/or using{' '}
                      <Link href="https://letsencrypt.org/" color="blue.500">
                        Let's Encrypt
                      </Link>
                      . For more information, please refer to the guidance on{' '}
                      <Link
                        href="https://www.gcpedia.gc.ca/gcwiki/images/8/89/Recommendations_for_TLS_Server_Certificates.pdf"
                        color="blue.500"
                      >
                        Recommendations for TLS Server Certificates
                      </Link>
                      .
                    </Trans>
                  </ListItem>
                </UnorderedList>
              </ListItem>
              {/* 6 */}
              <ListItem>
                <Trans>References:</Trans>
                <UnorderedList>
                  <ListItem>
                    <Link
                      href={
                        i18n.locale === 'en'
                          ? 'https://www.canada.ca/en/government/system/digital-government/policies-standards/enterprise-it-service-common-configurations/dns.html'
                          : 'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/politiques-normes/configurations-courantes-services-ti-integree/sites-web.html'
                      }
                      color="blue.500"
                    >
                      <Trans>
                        Domain Name System (DNS) Services Management
                        Configuration Requirements - Canada.ca
                      </Trans>
                    </Link>
                  </ListItem>
                  <ListItem>
                    <Link
                      href={
                        i18n.locale === 'en'
                          ? 'https://www.canada.ca/en/government/system/digital-government/policies-standards/enterprise-it-service-common-configurations/email.html'
                          : 'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/politiques-normes/configurations-courantes-services-ti-integree/courriels.html'
                      }
                      color="blue.500"
                    >
                      <Trans>
                        Email Management Services Configuration Requirements -
                        Canada.ca
                      </Trans>
                    </Link>
                  </ListItem>
                  <ListItem>
                    <Link
                      href={
                        i18n.locale === 'en'
                          ? 'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection'
                          : 'https://cyber.gc.ca/fr/orientation/directives-de-mise-en-oeuvre-protection-du-domaine-de-courrier'
                      }
                      color="blue.500"
                    >
                      <Trans>
                        Implementation guidance: email domain protection
                        (ITSP.40.065 v1.1) - Canadian Centre for Cyber Security
                      </Trans>
                    </Link>
                  </ListItem>
                </UnorderedList>
              </ListItem>
            </OrderedList>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Text fontSize="xl">
        <Trans>
          For any questions or concerns, please contact{' '}
          <Link href="mailto:zzTBSCybers@tbs-sct.gc.ca" color="blue.500">
            TBS Cyber Security
          </Link>{' '}
          .
        </Trans>
      </Text>
    </Box>
  )
}
