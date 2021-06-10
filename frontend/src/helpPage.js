import React from 'react'
import { Box, Divider, Heading, Link, List, ListItem } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import { UseLingui } from '@lingui/react'

export function helpPage() {
  const { i18n } = UseLingui()

  return (
    <Box mb={20} fontSize="sm">
      <Heading as='h2' textAlign='center' fontSize="4xl">
        <Trans>
          Get Help
        </Trans>
      </Heading>

      <Divider />

      <Heading as='h3' fontSize="2xl">
        <Trans>
          Government of Canada employees
        </Trans>
      </Heading>

      <Box>
        <Trans>
          Individuals at departments should contact their departmental information technology group for any questions regarding the following configuration requirement documents:
        </Trans>

        <List listStylePosition='outside' listStyleType='' ml={4}>
          <ListItem>
            <Link
              textDecoration='underline'
              isExternal={true}
              href={
                i18n.locale === 'en'
                  ? 'https://www.gcpedia.gc.ca/gcwiki/images/f/f9/Web_Sites_and_Services_Management_Configuration_Requirements_-_20210517.pdf'
                  : ''
              }
            >
              <Trans>
                Web Sites and Services Management
              </Trans>
            </Link>
          </ListItem>
          <ListItem>
            <Link
              textDecoration='underline'
              isExternal={true}
              href={
                i18n.locale === 'en'
                  ? 'https://www.gcpedia.gc.ca/gcwiki/images/d/d0/Email_Management_Services_Configuration_Requirements_-_20210517.pdf'
                  : ''
              }
            >
              <Trans>
                Email Management Services
              </Trans>
            </Link>
          </ListItem>
        </List>

        <Box my={2}>
          <Trans>
            Individuals from a departmental information technology group may contact the
          </Trans>
          <span> </span>
          <Link
            textDecoration='underline'
            isExternal={true}
            href='mailto:zzTBSCybers@tbs-sct.gc.ca'
          >
            <Trans>
              TBS Cyber Security mailbox
            </Trans>
          </Link>
          <span> </span>
          <Trans>
            for interpretations of the configuration requirement documents.
          </Trans>
        </Box>

        <Box my={2}>
          <Trans>
            Individuals with questions about the accuracy of their domain’s compliance data may contact the
          </Trans>
          <span> </span>
          <Link
            textDecoration='underline'
            isExternal={true}
            href='mailto:zzTBSCybers@tbs-sct.gc.ca'
          >
            <Trans>
              TBS Cyber Security mailbox
            </Trans>
          </Link>
          <Trans>
            . Note that compliance data does not automatically refresh. If you modified your domain recently, there may be a delay before your domain’s information updates.
          </Trans>
        </Box>
      </Box>
    </Box>
  )
}

export default helpPage;
