import React from 'react'
import { object, string } from 'prop-types'
import { Box, Icon, Stack, Text } from '@chakra-ui/core'
import { guidanceTags } from './guidanceTagConstants'

export function ScanCategoryDetails({ categoryName, categoryData }) {
  const dkimTagsExist = () =>
    categoryData.selectors.filter(
      (selector) => selector.dkimGuidanceTags.length,
    ).length

  const categories =
    categoryName === 'dkim' && dkimTagsExist() ? (
      categoryData.selectors
        .filter((selector) => selector.dkimGuidanceTags.length)
        .map((selector) => {
          return (
            <Box>
              <Stack isInline>
                <Icon name="warning" color="weak" />
                <Text fontWeight="bold">Selector:</Text>
                <Text>{selector.selector}</Text>
              </Stack>
              {selector.dkimGuidanceTags.map((guidanceTag) => {
                return (
                  <Box>
                    <Text>{`${guidanceTag}: ${guidanceTags[categoryName][guidanceTag].tag_name}`}</Text>
                    <Text
                      paddingLeft="3rem"
                      fontWeight="bold"
                    >{`Guidance: ${guidanceTags[categoryName][guidanceTag].guidance}`}</Text>
                    <Text>{`Summary: ${guidanceTags[categoryName][guidanceTag].summary}`}</Text>
                    {<Text>hi</Text>}
                  </Box>
                )
              })}
            </Box>
          )
        })
    ) : categoryName !== 'dkim' &&
      categoryData[`${categoryName}GuidanceTags`].length ? (
      categoryData[`${categoryName}GuidanceTags`].map((guidanceTag) => {
        return (
          <Box>
            <Text>
              <Icon name="warning" color="weak" />
              {`${guidanceTag}: ${guidanceTags[categoryName][guidanceTag].tag_name}`}
            </Text>
            <Text
              paddingLeft="3rem"
              fontWeight="bold"
            >{`Guidance: ${guidanceTags[categoryName][guidanceTag].guidance}`}</Text>
            <Text>{`Summary: ${guidanceTags[categoryName][guidanceTag].summary}`}</Text>
            {guidanceTags[categoryName][guidanceTag].ref_links_technical && (
              <Text>hi</Text>
            )}
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
      <Text fontWeight="bold">{categoryName.toUpperCase()}</Text>
      {categories}
    </div>
  )
}

ScanCategoryDetails.propTypes = {
  categoryName: string,
  categoryData: object,
}
