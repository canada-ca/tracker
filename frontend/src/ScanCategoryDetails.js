import React from 'react'
import { object, string } from 'prop-types'
import { Box, Heading } from '@chakra-ui/core'
import { GuidanceTagList } from './GuidanceTagList'
import WithPseudoBox from './withPseudoBox'

function ScanCategoryDetails({ categoryName, categoryData }) {
  const tagDetails =
    categoryName === 'dkim' ? (
      categoryData.edges[0]?.node.results.edges.map(({ node }, idx) => (
        <GuidanceTagList
          negativeTags={node.negativeGuidanceTags.edges}
          positiveTags={node.positiveGuidanceTags.edges}
          neutralTags={node.neutralGuidanceTags.edges}
          selector={node.selector}
          key={categoryName + idx}
        />
      ))
    ) : (
      <GuidanceTagList
        negativeTags={categoryData.edges[0]?.node.negativeGuidanceTags.edges}
        positiveTags={categoryData.edges[0]?.node.positiveGuidanceTags.edges}
        neutralTags={categoryData.edges[0]?.node.neutralGuidanceTags.edges}
        key={categoryName}
      />
    )

  return (
    <Box>
      <Heading as="h2" size="md">
        {categoryName.toUpperCase()}
      </Heading>
      {tagDetails}
    </Box>
  )
}

ScanCategoryDetails.propTypes = {
  categoryName: string,
  categoryData: object,
}

export default WithPseudoBox(ScanCategoryDetails)
