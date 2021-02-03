import React from 'react'
import { Box, Heading, Stack, Text } from '@chakra-ui/core'
import { object, string } from 'prop-types'
import ScanCategoryDetails from './ScanCategoryDetails'
import WithPseudoBox from './withPseudoBox'
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

  const topInfo = () => {
    if (scanType === 'web') {
      return (
        <Text fontWeight="bold" fontSize="xl">
          {status.https === 'PASS' && status.ssl === 'PASS'
            ? `ITPIN Compliant`
            : `Changes Required for ITPIN Compliance`}
        </Text>
      )
    } else if (scanType === 'email') {
      if (status) {
        return (
          <Text fontWeight="bold" fontSize="xl">
            <Trans>DMARC Implementation Phase: {status}</Trans>
          </Text>
        )
      } else {
        return (
          <Text fontWeight="bold" fontSize="xl">
            <Trans>DMARC Phase Unavailable</Trans>
          </Text>
        )
      }
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
          <Text fontSize={['md', 'lg']}>{cardDescription}</Text>
        </Stack>
      </Box>
      <Box>
        <Stack spacing="30px" px="1" mt="1">
          {topInfo()}
          {categoryList}
        </Stack>
      </Box>
    </Box>
  )
}

export default WithPseudoBox(ScanCard)

ScanCard.propTypes = {
  scanType: string,
  scanData: object,
  status: object,
}
