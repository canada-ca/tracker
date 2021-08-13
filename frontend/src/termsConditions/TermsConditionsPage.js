import React from 'react'
import { Box, Divider, Heading, Link, List, ListItem } from '@chakra-ui/react'
import { LinkIcon } from '@chakra-ui/icons'
import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'

export default function TermsConditionsPage() {
  const { i18n } = useLingui()

  const linkIcon = <LinkIcon ml={1} aria-hidden="true" />

  return (
    <Box mb={20} fontSize="sm">
      <Heading as="h2" textAlign="center" fontSize="4xl">
        <Trans>Terms and Conditions</Trans>
      </Heading>

      <Box height="fit-content" p={8}>
        <Heading as="h3" fontSize="xl">
          <Trans>Notice of Agreement</Trans>
        </Heading>

        <List listStylePosition="outside" listStyleType="" ml={4}>
          <ListItem>
            <Trans>
              By accessing, browsing, or using our website or our services, you
              acknowledge that you have read, understood, and agree to be bound
              by these Terms and Conditions, and to comply with all applicable
              laws and regulations. We recommend that you review all Terms and
              Conditions periodically to understand any updates or changes that
              may affect you. If you do not agree to these Terms and Conditions,
              please refrain from using our website, products and services.
            </Trans>
          </ListItem>
        </List>

        <Divider />

        <Heading as="h3" fontSize="xl">
          <Trans>Privacy</Trans>
        </Heading>

        <List listStylePosition="outside" listStyleType="" ml={4}>
          <ListItem>
            <Trans>
              For details related to terms pertaining to privacy, please refer
              to
            </Trans>
            <span> </span>
            <Link
              textDecoration="underline"
              isExternal={true}
              href={
                i18n.locale === 'en'
                  ? 'https://publiservice.tbs-sct.gc.ca/tbs-sct/cmn/notices-avis-eng.asp'
                  : 'https://www.canada.ca/fr/transparence/avis.html'
              }
            >
              <Trans>our Terms and Conditions on the TBS website</Trans>
              {linkIcon}
            </Link>
            <Trans>
              . Personal information will not be disclosed by Treasury Board
              Secretariat of Canada (TBS) except in accordance with the
            </Trans>
            <span> </span>
            <Link
              textDecoration="underline"
              isExternal={true}
              href={
                i18n.locale === 'en'
                  ? 'https://laws-lois.justice.gc.ca/eng/acts/P-21/index.html'
                  : 'https://laws-lois.justice.gc.ca/fra/lois/p-21/index.html'
              }
            >
              <Trans>Privacy Act.</Trans>
              {linkIcon}
            </Link>
          </ListItem>
        </List>

        <Divider />

        <Heading as="h3" fontSize="xl">
          <Trans>Access to Information</Trans>
        </Heading>

        <List listStylePosition="outside" listStyleType="" ml={4}>
          <ListItem>
            <Trans>
              Information shared with TBS, or acquired via systems hosted by
              TBS, may be subject to public disclosure under the
            </Trans>
            <span> </span>
            <Link
              textDecoration="underline"
              isExternal={true}
              href={
                i18n.locale === 'en'
                  ? 'https://www.canada.ca/en/treasury-board-secretariat/services/access-information-privacy/access-information-act.html'
                  : 'https://www.canada.ca/fr/secretariat-conseil-tresor/services/acces-information-protection-reseignements-personnels/loi-acces-information.html'
              }
            >
              <Trans>Access to Information Act.</Trans>
              {linkIcon}
            </Link>
          </ListItem>
        </List>

        <Divider />

        <Heading as="h3" fontSize="xl">
          <Trans>Data Security and Use</Trans>
        </Heading>

        <List listStylePosition="outside" listStyleType="" ml={4}>
          <ListItem>
            <Trans>
              You agree to protect any information disclosed to you by TBS in
              accordance with the data handling measures outlined in these Terms
              & Conditions. Similarly, TBS agrees to protect any information you
              disclose to us. Any such information must only be used for the
              purposes for which it was intended.
            </Trans>
          </ListItem>
        </List>

        <Divider />

        <Heading as="h3" fontSize="xl">
          <Trans>Intellectual Property, Copyright and Trademarks</Trans>
        </Heading>

        <List listStylePosition="outside" listStyleType="" ml={4}>
          <ListItem>
            <Trans>
              Any products or related services provided to you by TBS are and
              will remain the intellectual property of the Government of Canada.
            </Trans>
          </ListItem>
          <ListItem>
            <Trans>
              The graphics displayed on the Tracker website may not be used, in
              whole or in part, in connection with any business, products or
              service, or otherwise used, in a manner that is likely to lead to
              the belief that such business product, service or other use, has
              received the Government of Canada’s approval and may not be
              copied, reproduced, imitated, or used, in whole or in part,
              without the prior written permission of tbs.
            </Trans>
          </ListItem>
          <ListItem>
            <Trans>
              The material available on this web site is subject to the
            </Trans>
            <span> </span>
            <Link
              textDecoration="underline"
              isExternal={true}
              href={
                i18n.locale === 'en'
                  ? 'https://cb-cda.gc.ca/en/copyright-information/acts-and-regulations'
                  : 'https://cb-cda.gc.ca/fr/information-sur-le-droit-dauteur/lois-et-reglements'
              }
            >
              <Trans>Copyright Act</Trans>
              {linkIcon}
            </Link>
            <Trans>, and</Trans>
            <span> </span>
            <Link
              textDecoration="underline"
              isExternal={true}
              href={
                i18n.locale === 'en'
                  ? 'https://laws-lois.justice.gc.ca/eng/acts/t-13/FullText.html'
                  : 'https://laws-lois.justice.gc.ca/fra/lois/t-13/TexteComplet.html'
              }
            >
              <Trans>Trademarks Act</Trans>
              {linkIcon}
            </Link>
            <span> </span>
            <Trans>
              and by applicable laws, policies, regulations and international
              agreements.
            </Trans>
          </ListItem>
          <ListItem>
            <Trans>
              Use of intellectual property in breach of this agreement may
              result in the termination of access to the Tracker website,
              product or services.
            </Trans>
          </ListItem>
        </List>

        <Divider />

        <Heading as="h3" fontSize="xl">
          <Trans>Data Handling</Trans>
        </Heading>

        <List listStylePosition="outside" listStyleType="" ml={4}>
          <ListItem>
            <Trans>
              TBS agrees to protect any information you disclose to us in a
              manner commensurate with the level of protection you use to secure
              such information, but in any event, with no less than a reasonable
              level of care.
            </Trans>
          </ListItem>
          <ListItem>
            <Trans>
              You acknowledge that any data or information disclosed to TBS may
              be used to protect the Government of Canada as well as electronic
              information and information infrastructures designated as being of
              importance to the Government of Canada in accordance with cyber
              security and information assurance aspect of TBS’s mandate under
              the Policy on Government Security and the Policy on Service and
              Digital.
            </Trans>
          </ListItem>
          <ListItem>
            <Trans>
              Any data or information disclosed to TBS will be used in a manner
              consistent with our
            </Trans>
            <span> </span>
            <Link
              textDecoration="underline"
              isExternal={true}
              href={
                i18n.locale === 'en'
                  ? 'https://publiservice.tbs-sct.gc.ca/tbs-sct/cmn/notices-avis-eng.asp'
                  : 'https://publiservice.tbs-sct.gc.ca/tbs-sct/cmn/notices-avis-fra.asp'
              }
            >
              <Trans>Privacy Notice Statement</Trans>
              {linkIcon}
            </Link>
          </ListItem>
        </List>

        <Divider />

        <Heading as="h3" fontSize="xl">
          <Trans>Account</Trans>
        </Heading>

        <List listStylePosition="outside" listStyleType="" ml={4}>
          <ListItem>
            <Trans>
              You will need a Tracker account to use certain products and
              services. You are responsible for maintaining the confidentiality
              of your account, password and for restricting access to your
              account. You also agree to accept responsibility for all
              activities that occur under your account or password. TBS accepts
              no liability for any loss or damage arising from your failure to
              maintain the security of your account or password.
            </Trans>
          </ListItem>
          <ListItem>
            <Trans>
              You acknowledge that TBS will use the email address you provide as
              the primary method for communication.
            </Trans>
          </ListItem>
          <ListItem>
            <Trans>
              TBS reserves the right to refuse service, and may reject your
              application for an account, or cancel an existing account, for any
              reason, at our sole discretion.
            </Trans>
          </ListItem>
        </List>

        <Divider />

        <Heading as="h3" fontSize="xl">
          <Trans>Limitation of Liability</Trans>
        </Heading>

        <List listStylePosition="outside" listStyleType="" ml={4}>
          <ListItem>
            <Trans>
              The advice, guidance or services provided to you by TBS will be
              provided on an “as-is” basis, without warrantee or representation
              of any kind, and TBS will not be liable for any loss, liability,
              damage or cost, including loss of data or interruptions of
              business arising from the provision of such advice, guidance or
              services by Tracker. Consequently, TBS recommends, that the users
              exercise their own skill and care with respect to their use of the
              advice, guidance and services that Tracker provides.
            </Trans>
          </ListItem>
        </List>

        <Divider />

        <Heading as="h3" fontSize="xl">
          <Trans>Terms of Use</Trans>
        </Heading>

        <List listStylePosition="outside" listStyleType="" ml={4}>
          <ListItem>
            <Trans>
              You agree to use our website, products and services only for
              lawful purposes and in a manner that does not infringe the rights
              of, or restrict or inhibit the use and enjoyment of, the website,
              products or services by any third party. Additionally, you must
              not misuse, compromise or interfere with our services, or
              introduce material to our services that is malicious or
              technologically harmful. You must not attempt to gain unauthorized
              access to, tamper with, reverse engineer, or modify our website,
              products or services, the server(s) on which they are stored, or
              any server, computer or database connected to our website,
              products or services. We may suspend or stop providing our
              products or services to you if you do not comply with our terms or
              policies or if we are investigating suspected misconduct. Any
              suspected illegal use of our website, products or services may be
              reported to the relevant law enforcement authorities and where
              necessary we will co-operate with those authorities by disclosing
              your identity to them.
            </Trans>
          </ListItem>
          <ListItem>
            <Trans>
              Information on this site, other than protected intellectual
              property, such as copyright and trademarks, and Government of
              Canada symbols and other graphics, has been posted with the intent
              that it be readily available for personal and public
              non-commercial use and may be reproduced, in part or in whole and
              by any means, without charge or further permission from TBS. We
              ask only that:
            </Trans>
            <List listStylePosition="outside" listStyleType="circle" ml={8}>
              <ListItem>
                <Trans>
                  Users exercise due diligence in ensuring the accuracy of the
                  materials reproduced;
                </Trans>
              </ListItem>
              <ListItem>
                <Trans>TBS be identified as the source; and</Trans>
              </ListItem>
              <ListItem>
                <Trans>
                  The reproduction is not represented as an official version of
                  the materials reproduced, nor as having been made, in
                  affiliation with or under the direction of TBS.
                </Trans>
              </ListItem>
            </List>
          </ListItem>
        </List>

        <Divider />

        <Heading as="h3" fontSize="xl">
          <Trans>Notification of Changes</Trans>
        </Heading>

        <List listStylePosition="outside" listStyleType="" ml={4}>
          <ListItem>
            <Trans>
              We reserve the right to make changes to our website layout and
              content, policies, products, services, and these Terms and
              Conditions at any time without notice. Please check these Terms
              and Conditions regularly, as continued use of our services after a
              change has been made will be considered your acceptance of the
              change.
            </Trans>
          </ListItem>
        </List>

        <Divider />

        <Heading as="h3" fontSize="xl">
          <Trans>Termination</Trans>
        </Heading>

        <List listStylePosition="outside" listStyleType="" ml={4}>
          <ListItem>
            <Trans>
              We reserve the right to modify or terminate our services for any
              reason, without notice, at any time.
            </Trans>
          </ListItem>
          <ListItem>
            <Trans>
              If at any time you or your representatives wish to adjust or
              cancel these services, please contact us at
            </Trans>
            <span> </span>
            <Link
              textDecoration="underline"
              isExternal={true}
              href={
                i18n.locale === 'en'
                  ? 'https://https-everywhere.canada.ca/en/help/'
                  : 'https://https-everywhere.canada.ca/fr/aide/'
              }
            >
              <Trans>https://https-everywhere.canada.ca/en/help/</Trans>
              {linkIcon}
            </Link>
          </ListItem>
        </List>

        <Divider />

        <Heading as="h3" fontSize="xl">
          <Trans>Jurisdiction</Trans>
        </Heading>

        <List listStylePosition="outside" listStyleType="" ml={4}>
          <ListItem>
            <Trans>
              These terms and conditions shall be governed by and interpreted
              under the laws of Canada, without regard for any choice of law
              rules. The courts of Canada shall have exclusive jurisdiction over
              all matters arising in relation to these terms and conditions.
            </Trans>
          </ListItem>
        </List>
      </Box>
    </Box>
  )
}
