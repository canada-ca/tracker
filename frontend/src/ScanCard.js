import React from 'react'
import { Accordion, Box, Heading, Stack, Text } from '@chakra-ui/react'
import { CheckCircleIcon, WarningTwoIcon } from '@chakra-ui/icons'
import { any, object, string } from 'prop-types'
import ScanCategoryDetails from './ScanCategoryDetails'
import WithWrapperBox from './WithWrapperBox'
import { t, Trans } from '@lingui/macro'

function ScanCard({ scanType, scanData, status }) {
  const cardTitle =
    scanType === 'web'
      ? t`Web Scan Results`
      : scanType === 'email'
      ? t`Email Scan Results`
      : ''
  const cardDescription =
    scanType === 'web'
      ? t`Results for scans of web technologies (SSL, HTTPS).`
      : scanType === 'email'
      ? t`Results for scans of email technologies (DMARC, SPF, DKIM).`
      : ''

  const dmarcSteps = {
    assess: [
      t`Identify all domains and subdomains used to send mail;`,
      t`Assess current state;`,
      t`Deploy initial DMARC records with policy of none; and`,
      t`Collect and analyze DMARC reports.`,
    ],
    deploy: [
      t`Identify all authorized senders;`,
      t`Deploy SPF records for all domains;`,
      t`Deploy DKIM records and keys for all domains and senders; and`,
      t`Monitor DMARC reports and correct misconfigurations.`,
    ],
    enforce: [
      t`Upgrade DMARC policy to quarantine (gradually increment enforcement from 25% to 100%);`,
      t`Upgrade DMARC policy to reject (gradually increment enforcement from 25%to 100%); and`,
      t`Reject all messages from non-mail domains.`,
    ],
    maintain: [
      t`Monitor DMARC reports;`,
      t`Correct misconfigurations and update records as required; and`,
      t`Rotate DKIM keys annually.`,
    ],
  }

  const topInfo = () => {
    if (scanType === 'web') {
      return (
        <Box pb="1">
          {status.https === 'PASS' && status.ssl === 'PASS' ? (
            <Stack isInline align="center" px="2">
              <CheckCircleIcon color="strong" size="icons.md" />
              <Text fontWeight="bold" fontSize="2xl">
                <Trans>
                  Web Sites and Services Management Configuration Requirements
                  Compliant
                </Trans>
              </Text>
            </Stack>
          ) : (
            <Stack isInline align="center" px="2">
              <WarningTwoIcon color="moderate" size="icons.md" />
              <Text fontWeight="bold" fontSize="2xl">
                <Trans>
                  Changes required for Web Sites and Services Management
                  Configuration Requirements compliance
                </Trans>
              </Text>
            </Stack>
          )}
        </Box>
      )
    } else if (scanType === 'email') {
      if (status === null) {
        status = 'UNKNOWN'
      }
      return (
        <Box pb="1">
          <Stack isInline align="center" px="2">
            <Text fontWeight="bold" fontSize="2xl">
              <Trans>DMARC Implementation Phase: {status.toUpperCase()}</Trans>
            </Text>
          </Stack>
          {status !== 'UNKNOWN' && status !== 'not implemented' && (
            <Box bg="gray.100" px="2" py="1">
              {dmarcSteps[status].map((step, index) => (
                <Text key={index}>
                  {index + 1}. {step}
                </Text>
              ))}
            </Box>
          )}
        </Box>
      )
    } else {
      return ''
    }
  }

  const scanCategories = ['https', 'ssl', 'dmarc', 'spf', 'dkim']

  const categoryList = Object.entries(scanData)
    .filter(([categoryName, _categoryData]) =>
      scanCategories.includes(categoryName),
    )
    .map(([categoryName, categoryData]) => {
      return (
        <ScanCategoryDetails
          categoryName={categoryName}
          categoryData={categoryData}
          key={categoryName}
        />
      )
    })

  return (
    <Box bg="white" rounded="lg" overflow="hidden" boxShadow="medium" pb="1">
      <Box bg="primary" color="gray.50">
        <Stack px="3" py="1">
          <Heading as="h1" size="lg">
            {cardTitle}
          </Heading>
          <Text fontSize={{ base: 'md', md: 'lg' }}>{cardDescription}</Text>
        </Stack>
      </Box>
      <Box>
        <Stack spacing="30px" px="1" mt="1">
          {topInfo()}
          <Accordion allowMultiple defaultIndex={[0, 1, 2, 3]}>
            {categoryList}
          </Accordion>
        </Stack>
      </Box>
    </Box>
  )
}

export default WithWrapperBox(ScanCard)

ScanCard.propTypes = {
  scanType: string,
  scanData: object,
  status: any,
}
