import React from 'react'
import { object, string } from 'prop-types'
import { Box, Heading } from '@chakra-ui/core'
import { GuidanceTagList } from './GuidanceTagList'
import WithPseudoBox from './withPseudoBox'

function ScanCategoryDetails({ categoryName, categoryData }) {
  const guidanceTagPropertyName = `${categoryName}GuidanceTags`

  const tagDetails =
    categoryName === 'dkim'
      ? categoryData.selectors.map((selectorData) => {
          return (
            <GuidanceTagList
              guidanceTags={selectorData[guidanceTagPropertyName]}
              selector={selectorData.selector}
              categoryName={categoryName}
            />
          )
        })
      : [
          <GuidanceTagList
            guidanceTags={categoryData[guidanceTagPropertyName]}
            categoryName={categoryName}
          />,
        ]

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
