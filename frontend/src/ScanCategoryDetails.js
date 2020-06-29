import React from 'react'
import { object, string } from 'prop-types'
import { Icon, Text } from '@chakra-ui/core'

export function ScanCategoryDetails({ categoryName, categoryData }) {
  const output = categoryData[`${categoryName}GuidanceTags`].length ? (
    categoryData[`${categoryName}GuidanceTags`].map((guidanceTag) => {
      return (
        <Text>
          <Icon name="warning" color="weak" />
          {guidanceTag}
        </Text>
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
      <Text>{categoryName}</Text>
      {output}
    </div>
  )
}

ScanCategoryDetails.propTypes = {
  categoryName: string,
  categoryData: object,
}
