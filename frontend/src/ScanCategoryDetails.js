import React from 'react'
import { object, string } from 'prop-types'
import { Box, Heading } from '@chakra-ui/core'
import { GuidanceTagList } from './GuidanceTagList'
import { PolicyComplianceDetails } from './PolicyComplianceDetails'
import WithPseudoBox from './withPseudoBox'

function ScanCategoryDetails({ categoryName, categoryData }) {
  const tagDetails =
    categoryName === 'dkim' ? (
      categoryData.edges[0]?.node.results.edges.map(({ node }, idx) => (
        <GuidanceTagList
          guidanceTags={node.guidanceTags.edges}
          selector={node.selector}
          key={categoryName + idx}
        />
      ))
    ) : (
      <GuidanceTagList
        guidanceTags={categoryData.edges[0]?.node.guidanceTags.edges}
        key={categoryName}
      />
    )

  const policyDetails =
    categoryName === 'https' ||
    categoryName === 'dmarc' ||
    categoryName === 'spf' ? (
      <PolicyComplianceDetails
        categoryName={categoryName}
        policies={categoryData.edges[0]?.node}
      />
    ) : null

  return (
    <Box>
      <Heading as="h2" size="md">
        {categoryName.toUpperCase()}
      </Heading>
      {policyDetails}
      {tagDetails}
    </Box>
  )
}

ScanCategoryDetails.propTypes = {
  categoryName: string,
  categoryData: object,
}

export default WithPseudoBox(ScanCategoryDetails)
