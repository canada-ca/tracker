import React from 'react'
import { Box, Heading, Stack, Text } from '@chakra-ui/core'
import { object, string } from 'prop-types'
import ScanCategoryDetails from './ScanCategoryDetails'
import WithPseudoBox from './withPseudoBox'
import { t } from '@lingui/macro'

function ScanCard({ scanType, scanData }) {
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
    <Box bg="gray.200" py="2.5">
      <Stack px="1">
        <Heading as="h1" size="lg">
          {cardTitle}
        </Heading>
        <Text>{cardDescription}</Text>
        <Stack spacing="30px">{categoryList}</Stack>
      </Stack>
    </Box>
  )
}

export default WithPseudoBox(ScanCard)

ScanCard.propTypes = {
  scanType: string,
  scanData: object,
}
