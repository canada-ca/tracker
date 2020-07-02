import React from 'react'
import { object, string } from 'prop-types'
import { Box, Icon, Text } from '@chakra-ui/core'
import { guidanceTags } from './guidanceTagConstants'

export function ScanCategoryDetails({ categoryName, categoryData }) {
  const categories = categoryData[`${categoryName}GuidanceTags`].length ? (
    categoryData[`${categoryName}GuidanceTags`].map((guidanceTag) => {
      return (
        <Box>
          <Text>
            <Icon name="warning" color="weak" />
            {`${guidanceTag}: ${guidanceTags[categoryName][guidanceTag].tag_name}`}
          </Text>
          <Text paddingLeft="3rem" fontWeight="bold">{`Guidance: ${guidanceTags[categoryName][guidanceTag].guidance}`}</Text>
        </Box>
      )
    })
  ) : (
    <Text>
      <Icon name="check-circle" color="strong" />
      Properly configured!
    </Text>
  )

  return (
    <div>
      <Text fontWeight="bold">{categoryName}</Text>
      {categories}
    </div>
  )
}

ScanCategoryDetails.propTypes = {
  categoryName: string,
  categoryData: object,
}
