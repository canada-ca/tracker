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
          guidanceTags={node.guidanceTags.edges}
          selector={node.selector}
          categoryName={categoryName}
          key={categoryName + idx}
        />
      ))
    ) : (
      <GuidanceTagList
        guidanceTags={categoryData.edges[0]?.node.guidanceTags.edges}
        categoryName={categoryName}
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
