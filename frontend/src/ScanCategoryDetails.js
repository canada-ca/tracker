import React from 'react'
import { object, string } from 'prop-types'
import { Box, Divider, Heading } from '@chakra-ui/core'
import { GuidanceTagList } from './GuidanceTagList'

export function ScanCategoryDetails({ categoryName, categoryData }) {
  const guidanceTagPropertyName = `${categoryName}GuidanceTags`

  const tagDetails =
    categoryName === 'dkim' ? (
      categoryData.selectors.map((selectorData, index) => {
        return (
          <Box>
            <GuidanceTagList
              guidanceTags={selectorData[guidanceTagPropertyName]}
              selector={selectorData.selector}
              categoryName={categoryName}
            />
          </Box>
        )
      })
    ) : (
      <GuidanceTagList
        guidanceTags={categoryData[guidanceTagPropertyName]}
        categoryName={categoryName}
      />
    )

  // categoryName === 'dkim' && dkimTagsExist() ? (
  //   categoryData.selectors
  //     .filter((selector) => selector.dkimGuidanceTags.length)
  //     .map((selector) => {
  //       return (
  //         <Box>
  //           <Stack isInline>
  //             <Icon name="warning" color="weak" />
  //             <Text fontWeight="bold">Selector:</Text>
  //             <Text>{selector.selector}</Text>
  //           </Stack>
  //           {selector.dkimGuidanceTags.map((guidanceTag) => {
  //             return (
  //               <Box>
  //                 <Text>{`${guidanceTag}: ${guidanceTags[categoryName][guidanceTag].tag_name}`}</Text>
  //                 <Text fontWeight="bold">{`Guidance: ${guidanceTags[categoryName][guidanceTag].guidance}`}</Text>
  //                 <Text>{`Summary: ${guidanceTags[categoryName][guidanceTag].summary}`}</Text>
  //               </Box>
  //             )
  //           })}
  //         </Box>
  //       )
  //     })
  // ) : categoryName !== 'dkim' &&
  //   categoryData[`${categoryName}GuidanceTags`].length ? (
  //   categoryData[`${categoryName}GuidanceTags`].map((guidanceTag) => {
  //     return (
  //       <Box>
  //         <Text>
  //           <Icon name="warning" color="weak" />
  //           {`${guidanceTag}: ${guidanceTags[categoryName][guidanceTag].tag_name}`}
  //         </Text>
  //         <Text fontWeight="bold">{`Guidance: ${guidanceTags[categoryName][guidanceTag].guidance}`}</Text>
  //         <Text>{`Summary: ${guidanceTags[categoryName][guidanceTag].summary}`}</Text>
  //       </Box>
  //     )
  //   })
  // ) : (
  //   <Text>
  //     <Icon name="check-circle" color="strong" />
  //     Properly configured!
  //   </Text>
  // )

  return (
    <Box>
      <Divider borderColor="gray.700" />
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
