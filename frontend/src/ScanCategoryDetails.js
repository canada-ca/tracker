import React from 'react'
import { object, string } from 'prop-types'
import { Box, Heading, Collapse } from '@chakra-ui/core'
import { TrackerButton } from './TrackerButton'
import { GuidanceTagList } from './GuidanceTagList'
import WithPseudoBox from './withPseudoBox'

function ScanCategoryDetails({ categoryName, categoryData }) {
  const [show, setShow] = React.useState(true)
  const handleShow = () => setShow(!show)

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
    <Box pb="2">
      <TrackerButton variant="primary" onClick={handleShow} w={['100%', '25%']}>
        <Heading as="h2" size="md">
          {categoryName.toUpperCase()}
        </Heading>
      </TrackerButton>
      <Collapse isOpen={show}>{tagDetails}</Collapse>
    </Box>
  )
}

ScanCategoryDetails.propTypes = {
  categoryName: string,
  categoryData: object,
}

export default WithPseudoBox(ScanCategoryDetails)
