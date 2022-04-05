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
} from '@chakra-ui/react'
import { Link as RouteLink } from 'react-router-dom'

export default function ReadGuidancePage() {
  return (
    <Box w="100%" p="4">
      <Heading>
        <Trans>Read guidance</Trans>
      </Heading>
      <Divider borderBottomColor="gray.900" mb="2" />
      <Text mb="4" fontSize="xl">
        <Trans>
          Help us make government websites more secure. Please complete the
          following steps to become compliant with the Government of Canada's
          web security standards. If you have any questions about this process,
          please{' '}
          <Link color="blue.500" as={RouteLink}>
            contact us
          </Link>
          .
        </Trans>
      </Text>
      <OrderedList fontSize="xl" p="8" spacing="4">
        <ListItem>
          <Trans>
            Identify key resources required to act as central point(s) of
            contact with TBS and the HTTPS Community of Practice.
          </Trans>
        </ListItem>
        <ListItem>
          <Trans>
            Perform an inventory of all departmental domains and subdomains.
            Sources of information include:
          </Trans>
          <UnorderedList>
            <ListItem>
              <Trans>
                Internally available{' '}
                <Link
                  isExternal
                  color="blue.500"
                  href="https://tracker.canada.ca/"
                >
                  Tracker Dashboard
                </Link>
              </Trans>
            </ListItem>
            <ListItem>
              <Trans>TBS Application Portfolio Management (APM)</Trans>
            </ListItem>
            <ListItem>
              <Trans>Departmental business units</Trans>
            </ListItem>
          </UnorderedList>
        </ListItem>
        <ListItem>
          <Trans>
            Provide an up-to-date list of all domain and sub-domains of the
            publicly-accessible websites and web services to{' '}
            <Link color="blue.500" href="mailto:zzTBSCybers@tbs-sct.gc.ca">
              TBS Cybersecurity
            </Link>
            .
          </Trans>
        </ListItem>
        <ListItem>
          <Trans>
            Perform an assessment of the domains and sub-domains to determine
            the status of the configuration. Tools available to support this
            activity includes the{' '}
            <Link isExternal color="blue.500" href="https://tracker.canada.ca/">
              Tracker Dashboard
            </Link>
            ,{' '}
            <Link
              isExternal
              color="blue.500"
              href="https://www.ssllabs.com/ssltest/"
            >
              SSL Labs
            </Link>
            ,{' '}
            <Link isExternal color="blue.500" href="https://www.hardenize.com/">
              Hardenize
            </Link>
            ,{' '}
            <Link
              isExternal
              color="blue.500"
              href="https://www.sslshopper.com/"
            >
              SSLShopper
            </Link>
            , etc.
          </Trans>
        </ListItem>
        <ListItem>
          <Trans>
            Develop a prioritized implementation schedule for each of the
            affected websites and web services, following the recommended
            prioritization approach in the ITPIN:{' '}
          </Trans>
          <UnorderedList>
            <ListItem>
              <Trans>
                6.2.1 Newly developed websites and web services must adhere to
                this ITPIN upon launch.
              </Trans>
            </ListItem>
            <ListItem>
              <Trans>
                6.2.2 Websites and web services that involve an exchange of
                personal information or other sensitive information must receive
                priority following a risk-based approach, and migrate as soon as
                possible.
              </Trans>
            </ListItem>
            <ListItem>
              <Trans>
                6.2.3 All remaining websites and web services must be accessible
                through a secure connection, as outlined in Section 6.1, by
                December 31, 2019.
              </Trans>
            </ListItem>
          </UnorderedList>
        </ListItem>
        <ListItem>
          <Trans>
            Engage departmental IT planning groups for implementation as
            appropriate.{' '}
          </Trans>
          <UnorderedList>
            <ListItem>
              <Trans>
                Where necessary adjust IT Plans and budget estimates for the FY
                where work is expected.
              </Trans>
            </ListItem>
            <ListItem>
              <Trans>
                It is recommended that SSC partners contact their SSC Service
                Delivery Manager to discuss the departmental action plan and
                required steps to submit a request for change.
              </Trans>
            </ListItem>
          </UnorderedList>
        </ListItem>
        <ListItem>
          <Trans>
            Based on the assessment, and using the{' '}
            <Link
              isExternal
              color="blue.500"
              href="https://wiki.gccollab.ca/GC_HTTPS_Everywhere/Implementation_Guidance"
            >
              HTTPS Everywhere Guidance Wiki
            </Link>
            , the following activities may be required:
          </Trans>{' '}
          <UnorderedList>
            <ListItem>
              <Trans>
                Obtain certificates from a GC-approved certificate source as
                outlined in the Recommendations for TLS Server Certificates for
                GC Public Facing Web Services
              </Trans>
            </ListItem>
            <ListItem>
              <Trans>
                Obtain the configuration guidance for the appropriate endpoints
                (e.g. web server, network/security appliances, etc.) and
                implement recommended configurations to support HTTPS.
              </Trans>
            </ListItem>
          </UnorderedList>
        </ListItem>
        <ListItem>
          <Trans>
            Perform another assessment of the applicable domains and sub-domains
            to confirm that the configuration has been updated and that HTTPS is
            enforced in accordance with the ITPIN. Results will appear in the
            Tracker Dashboard within 24 hours.
          </Trans>
        </ListItem>
      </OrderedList>
      <Text fontSize="xl">
        <Trans>
          For any questions or concerns related to the ITPIN and related
          implementation guidance, contact TBS Cybersecurity (
          <Link color="blue.500" href="mailto:zzTBSCybers@tbs-sct.gc.ca">
            zzTBSCybers@tbs-sct.gc.ca
          </Link>
          ).
        </Trans>
      </Text>
    </Box>
  )
}
