import React from 'react'
import { Stack, Text } from '@chakra-ui/core'
import { object, string } from 'prop-types'
import { ScanCategoryDetails } from './ScanCategoryDetails'

export function ScanCard({ scanType, scanData }) {
  const cardTitle =
    scanType === 'web'
      ? 'Web Scan Results'
      : scanType === 'email'
      ? 'Email scan results'
      : ''
  const cardDescription =
    scanType === 'web'
      ? 'Results for scans of web technologies (SSL, HTTPS)'
      : scanType === 'email'
      ? 'Results for scans of email technologies (DMARC, SPF, DKIM)'
      : ''

  const scanCategories = ['https', 'ssl', 'dmarc', 'spf', 'dkim']

  console.log(scanData)
  console.log(Object.entries(scanData))

  console.log(
    Object.entries(scanData).filter(([categoryName, _categoryData]) => {
      return scanCategories.includes(categoryName)
    }),
  )

  return (
    <Stack bg="gray.300" px="6px">
      <Text fontSize="xl">{cardTitle}</Text>
      <Text>{cardDescription}</Text>
      {Object.entries(scanData)
        .filter(([categoryName, _categoryData]) =>
          scanCategories.includes(categoryName),
        )
        .map(([categoryName, categoryData]) => {
          console.log('catname', categoryName)
          console.log('data', categoryData)
          return (
            <ScanCategoryDetails
              categoryName={categoryName}
              categoryData={categoryData}
            />
          )
        })}
    </Stack>
  )
}

ScanCard.propTypes = {
  scanType: string,
  scanData: object,
}
