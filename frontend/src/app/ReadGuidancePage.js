import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Heading, Text, Link, ListItem, OrderedList, UnorderedList, Divider, Code } from '@chakra-ui/react'
import { useLingui } from '@lingui/react'

export default function ReadGuidancePage() {
  const { i18n } = useLingui()

  return (
    <Box w="100%" p="4" fontSize="xl">
      <Heading>
        <Trans>Getting Started</Trans>
      </Heading>
      <Divider borderBottomColor="gray.900" mb="2" />
      <Box px="4" pb="4">
        <Text>
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
            provides expectations on how GC organizations are to manage their Information Technology (IT) services. The
            focus of the Tracker tool is to help organizations stay in compliance with the directives{' '}
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
        <Text mt="4">
          <Trans>Below are steps on how government organizations can leverage the Tracker platform:</Trans>
        </Text>
        <OrderedList spacing="4" px="4">
          {/* 1 */}
          <ListItem>
            <Text>
              <Trans>Getting an Account:</Trans>
            </Text>
            <UnorderedList mb="2" px="2">
              <ListItem>
                <Text>
                  <Trans>
                    Identify any current affiliated Tracker users within your organization and develop a plan with them.
                  </Trans>
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  <Trans>
                    If your organization has no affiliated users within Tracker, contact the{' '}
                    <Link href="mailto:zzTBSCybers@tbs-sct.gc.ca" color="blue.500">
                      TBS Cyber Security
                    </Link>{' '}
                    to assist in onboarding.
                  </Trans>
                </Text>
                <UnorderedList>
                  <ListItem>
                    <Text>
                      <Trans>
                        Once access is given to your department by the TBS Cyber team, they will be able to invite and
                        manage other users within the organization and manage the domain list.
                      </Trans>
                    </Text>
                  </ListItem>
                </UnorderedList>
              </ListItem>
            </UnorderedList>
          </ListItem>
          {/* 2 */}
          <ListItem>
            <Text>
              <Trans>Managing Your Domains:</Trans>
            </Text>
            <UnorderedList mb="2" px="2">
              <ListItem>
                <Text>
                  <Trans>
                    Each organization’s domain list should include every internet-facing service. It is the
                    responsibility of organization admins to manage the current list and identify new domains to add.
                  </Trans>
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  <Trans>
                    Domains are only to be removed from your list when 1) they no longer exist, meaning they are deleted
                    from the DNS returning an error code of NXDOMAIN (domain name does not exist); or 2) if you have
                    identified that they do not belong to your organization.
                  </Trans>
                </Text>
                <UnorderedList>
                  <ListItem>
                    <Text>
                      <Trans>
                        If a domain is no longer in use but still exists on the DNS, it is still vulnerable to email
                        spoofing attacks, where an attacker can send an email that appears to be coming from your
                        domain.
                      </Trans>
                    </Text>
                  </ListItem>
                </UnorderedList>
              </ListItem>
            </UnorderedList>
          </ListItem>
          {/* 3 */}
          <ListItem>
            <Text>
              <Trans>Understanding Scan Metrics:</Trans>
            </Text>
            <UnorderedList mb="2" px="2">
              <ListItem>
                <Text>
                  <Trans>The summary cards show two metrics that Tracker scans:</Trans>
                </Text>
                <OrderedList>
                  <ListItem>
                    <Trans>The percentage of web-hosting services that strongly enforce HTTPS</Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      The percentage of internet-facing services that have a DMARC policy of at least p=”none”
                    </Trans>
                  </ListItem>
                </OrderedList>
              </ListItem>
              <ListItem>
                <Text>
                  <Trans>
                    These metrics are an important first step in securing your services and should be treated as minimum
                    requirements. Further metrics are available in your organization's domain list.
                  </Trans>
                </Text>
              </ListItem>
              <ListItem>
                <Trans>Tracker results refresh every 24 hours.</Trans>
              </ListItem>
            </UnorderedList>
          </ListItem>
          {/* 4 */}
          <ListItem>
            <Trans>Develop a prioritized schedule to address any failings:</Trans>
            <UnorderedList>
              <ListItem>
                <Trans>Consider prioritizing websites and web services that exchange Protected data.</Trans>
              </ListItem>
              <ListItem>
                <Trans>Where necessary adjust IT Plans and budget estimates where work is expected.</Trans>
              </ListItem>
              <ListItem>
                <Trans>
                  It is recommended that Shared Service Canada (SSC) partners contact their SSC Service Delivery Manager
                  to discuss action plans and required steps to submit a request for change.
                </Trans>
              </ListItem>
              <ListItem>
                <Trans>
                  Obtain certificates from a GC-approved certificate source as outlined in the Recommendations for TLS
                  Server Certificates for GC public facing web services
                </Trans>
              </ListItem>
              <ListItem>
                <Trans>
                  Obtain the configuration guidance for the appropriate endpoints (e.g., web server, network/security
                  appliances, etc.) and implement recommended configurations.
                </Trans>
              </ListItem>
            </UnorderedList>
          </ListItem>
          {/* 5 */}
          <ListItem>
            <Text>
              <Trans>
                To ensure accurate scanning results, configure your firewall and DDoS (Denial of Service) protection
                settings to permit required scanning traffic. Work with your IT team and/or your SSC Service Delivery
                Manager to add the scanning IP address (52.138.13.28) to your network's allow lists.
              </Trans>
            </Text>
            <UnorderedList>
              <ListItem>
                <Text>
                  <Trans>Our scan requests can be identified by the following User-Agent header:</Trans>{' '}
                  <Code>
                    Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0 Tracker-Suivi
                    (+https://github.com/canada-ca/tracker)
                  </Code>
                </Text>
              </ListItem>
            </UnorderedList>
          </ListItem>
          {/* 6 */}
          <ListItem>
            <Text>
              <Trans>Links to Review:</Trans>
            </Text>
            <UnorderedList px="2">
              <ListItem>
                <Trans>Tracker:</Trans>
                <UnorderedList>
                  <ListItem>
                    <Link href="https://github.com/canada-ca/tracker/wiki" color="blue.500">
                      <Trans>Wiki</Trans>
                    </Link>
                  </ListItem>
                  <ListItem>
                    <Link href="https://github.com/canada-ca/tracker/wiki/Guidance-Tags" color="blue.500">
                      <Trans>List of guidance tags</Trans>
                    </Link>
                  </ListItem>
                </UnorderedList>
              </ListItem>
              <ListItem>
                <Text>
                  <Trans>Web Security:</Trans>
                </Text>
                <UnorderedList mb="2">
                  <ListItem>
                    <Text>
                      <Trans>
                        Requirements:{' '}
                        <Link
                          href={
                            i18n.locale === 'en'
                              ? 'https://www.canada.ca/en/government/system/digital-government/policies-standards/enterprise-it-service-common-configurations/web-sites.html'
                              : 'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/politiques-normes/configurations-courantes-services-ti-integree/sites-web.html'
                          }
                          color="blue.500"
                          isExternal
                        >
                          Web Sites and Services Management Configuration Requirements
                        </Link>
                      </Trans>
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text>
                      <Trans>
                        Implementation:{' '}
                        <Link
                          href={
                            i18n.locale === 'en'
                              ? 'https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062#a3'
                              : 'https://cyber.gc.ca/fr/orientation/conseils-sur-la-configuration-securisee-des-protocoles-reseau-itsp40062'
                          }
                          color="blue.500"
                          isExternal
                        >
                          Guidance on securely configuring network protocols (ITSP.40.062)
                        </Link>
                      </Trans>
                    </Text>
                  </ListItem>
                </UnorderedList>
              </ListItem>
              <ListItem>
                <Text>
                  <Trans>Email Security:</Trans>
                </Text>
                <UnorderedList mb="2">
                  <ListItem>
                    <Text>
                      <Trans>
                        Requirements:{' '}
                        <Link
                          href={
                            i18n.locale === 'en'
                              ? 'https://www.canada.ca/en/government/system/digital-government/policies-standards/enterprise-it-service-common-configurations/email.html'
                              : 'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/politiques-normes/configurations-courantes-services-ti-integree/courriels.html'
                          }
                          color="blue.500"
                          isExternal
                        >
                          Email Management Services Configuration Requirements
                        </Link>
                      </Trans>
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text>
                      <Trans>
                        Implementation:{' '}
                        <Link
                          href={
                            i18n.locale === 'en'
                              ? 'https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection'
                              : 'https://cyber.gc.ca/fr/orientation/directives-de-mise-en-oeuvre-protection-du-domaine-de-courrier'
                          }
                          color="blue.500"
                          isExternal
                        >
                          Implementation guidance: email domain protection (ITSP.40.065 v1.1)
                        </Link>
                      </Trans>
                    </Text>
                  </ListItem>
                </UnorderedList>
              </ListItem>
            </UnorderedList>
          </ListItem>
        </OrderedList>
      </Box>

      <Heading id="faq" tabIndex="-1">
        <Trans>Frequently Asked Questions</Trans>
      </Heading>
      <Divider borderBottomColor="gray.900" mb="2" />
      <Box px="4" pb="4">
        <OrderedList spacing="4">
          {/* 1 */}
          <ListItem>
            <Trans>It is not clear to me why a domain has failed?</Trans>
            <UnorderedList>
              <ListItem>
                <Trans>
                  Please contact{' '}
                  <Link href="mailto:zzTBSCybers@tbs-sct.gc.ca" color="blue.500">
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
                <Trans>Admins of an organization can add domains to their list.</Trans>
              </ListItem>
              <ListItem>
                <Trans>
                  Only{' '}
                  <Link href="mailto:zzTBSCybers@tbs-sct.gc.ca" color="blue.500">
                    TBS Cyber Security
                  </Link>{' '}
                  can remove domains from your organization. Domains are only to be removed from your list when 1) they
                  no longer exist, meaning they are deleted from the DNS returning an error code of NX DOMAIN (domain
                  name does not exist); or 2) if you have identified that they do not belong to your organization.
                </Trans>
              </ListItem>
            </UnorderedList>
          </ListItem>
          {/* 3 */}
          <ListItem>
            <Trans>Why do other tools show positive results for a domain while Tracker shows negative results?</Trans>
            <UnorderedList>
              <ListItem>
                <Trans>
                  While other tools are useful to work alongside Tracker, they do not specifically adhere to the
                  configuration requirements specified in the{' '}
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
                    Web Site and Service Management Configuration Requirements
                  </Link>
                  . For a list of allowed protocols, ciphers, and curves review the{' '}
                  <Link
                    href={
                      i18n.locale === 'en'
                        ? 'https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062#a3'
                        : 'https://cyber.gc.ca/fr/orientation/conseils-sur-la-configuration-securisee-des-protocoles-reseau-itsp40062'
                    }
                    color="blue.500"
                    isExternal
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
                  By default our scanners check domains ending in “.gc.ca” and “.canada.ca”. If your domain is outside
                  that set, you need to contact us to let us know. Send an email to{' '}
                  <Link href="mailto:zzTBSCybers@tbs-sct.gc.ca" color="blue.500">
                    TBS Cyber Security
                  </Link>{' '}
                  to confirm your ownership of that domain.
                </Trans>
              </ListItem>
              <ListItem>
                <Trans>Another possibility is that your domain is not internet facing.</Trans>
              </ListItem>
            </UnorderedList>
          </ListItem>
          {/* 5 */}
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
          <ListItem id="dkim-selectors">
            <Trans>Why does the guidance page not show the domain’s DKIM selectors even though they exist?</Trans>
            <UnorderedList>
              <ListItem>
                <Trans>
                  Tracker automatically adds DKIM selectors using DMARC reports. Selectors will be added to Tracker when
                  1) the domain has a DMARC RUA record which includes "mailto:dmarc@cyber.gc.ca"; and 2) the selector
                  has been used to sign an email and passed DKIM validation. If your DKIM selectors or any DMARC
                  information is missing, please email{' '}
                  <Link href="mailto:zzTBSCybers@tbs-sct.gc.ca" color="blue.500">
                    TBS Cyber Security
                  </Link>
                  .
                </Trans>
              </ListItem>
              <ListItem>
                <Trans>
                  The process of detecting DKIM selectors is not immediate. It may take more than 24 hours for the
                  selectors to appear in Tracker after the conditions are met.
                </Trans>
              </ListItem>
            </UnorderedList>
          </ListItem>
          {/* 7 */}
          <ListItem>
            <Trans>
              My domain does not send emails, how can I get my domain's DMARC, DKIM, and SPF compliance checks to pass?
            </Trans>
            <UnorderedList>
              <Trans>
                <ListItem>
                  Follow the guidance found in section B.4 of the{' '}
                  <Link
                    href={
                      i18n.locale === 'en'
                        ? 'https://www.cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb4'
                        : 'https://www.cyber.gc.ca/fr/orientation/directives-de-mise-en-oeuvre-protection-du-domaine-de-courrier#ann24'
                    }
                    color="blue.500"
                    isExternal
                  >
                    ITSP.40.065 v1.1
                  </Link>
                  .
                </ListItem>
              </Trans>
            </UnorderedList>
          </ListItem>
          {/* 8 */}
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
                  <Trans>Domain Name System (DNS) Services Management Configuration Requirements - Canada.ca</Trans>
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
                  <Trans>Email Management Services Configuration Requirements - Canada.ca</Trans>
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
                    Implementation guidance: email domain protection (ITSP.40.065 v1.1) - Canadian Centre for Cyber
                    Security
                  </Trans>
                </Link>
              </ListItem>
              <ListItem>
                <Link color="blue.500" href="https://ssl-config.mozilla.org/">
                  <Trans>Mozilla SSL Configuration Generator</Trans>
                </Link>
              </ListItem>
              <ListItem>
                <Link color="blue.500" href="https://www.gov.uk/guidance/protect-domains-that-dont-send-email">
                  <Trans>Protect domains that do not send email - GOV.UK (www.gov.uk)</Trans>
                </Link>
              </ListItem>
            </UnorderedList>
          </ListItem>
        </OrderedList>
      </Box>
      <Text mb="8">
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
