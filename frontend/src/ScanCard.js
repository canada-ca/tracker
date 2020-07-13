import React from 'react'
import { Box, Heading, Stack, Text } from '@chakra-ui/core'
import { object, string } from 'prop-types'
import ScanCategoryDetails from './ScanCategoryDetails'
import WithPseudoBox from './withPseudoBox'

function ScanCard({ scanType, scanData }) {
  const cardTitle =
    scanType === 'web'
      ? 'Web Scan Results'
      : scanType === 'email'
      ? 'Email Scan Results'
      : ''
  const cardDescription =
    scanType === 'web'
      ? 'Results for scans of web technologies (SSL, HTTPS). Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc pretium cursus ornare. Vivamus at nunc sem. Suspendisse lorem tortor, euismod ac commodo vel, egestas at sem. Aliquam erat volutpat. Praesent ultricies euismod finibus. Nullam vestibulum mi at ipsum malesuada, ac.'
      : scanType === 'email'
      ? 'Results for scans of email technologies (DMARC, SPF, DKIM). Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc pretium cursus ornare. Vivamus at nunc sem. Suspendisse lorem tortor, euismod ac commodo vel, egestas at sem. Aliquam erat volutpat. Praesent ultricies euismod finibus. Nullam vestibulum mi at ipsum malesuada, ac.'
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
    <Box bg="gray.200" py="10px">
      <Stack px="15px">
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
