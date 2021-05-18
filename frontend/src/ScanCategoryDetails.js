import React, { useState } from 'react'
import { object, string } from 'prop-types'
import { Box, Heading, Collapse, Divider } from '@chakra-ui/core'
import { TrackerButton } from './TrackerButton'
import { GuidanceTagList } from './GuidanceTagList'
import WithPseudoBox from './withPseudoBox'
import { Trans } from '@lingui/macro'

function ScanCategoryDetails({ categoryName, categoryData }) {
  const [showCategory, setShowCategory] = useState(true)
  const handleShowCategory = () => setShowCategory(!showCategory)
  const [showSummary, setShowSummary] = useState(true)
  const handleShowSummary = () => setShowSummary(!showSummary)
  const [showCiphers, setShowCiphers] = useState(true)
  const handleShowCiphers = () => setShowCiphers(!showCiphers)

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

  const webSummary =
    categoryName === 'https'
      ? {
          implementation: categoryData.edges[0]?.node.implementation,
          enforced: categoryData.edges[0]?.node.enforced,
          hsts: categoryData.edges[0]?.node.hsts,
          hstsAge: categoryData.edges[0]?.node.hstsAge,
          preloaded: categoryData.edges[0]?.node.preloaded,
        }
      : categoryName === 'ssl'
      ? {
          ccsInjectionVulnerable:
            categoryData.edges[0]?.node.ccsInjectionVulnerable,
          heartbleedVulnerable:
            categoryData.edges[0]?.node.heartbleedVulnerable,
          supportsEcdhKeyExchange:
            categoryData.edges[0]?.node.supportsEcdhKeyExchange,
        }
      : null

  const ciphers = categoryName === 'ssl' && {
    acceptableCiphers: categoryData.edges[0]?.node.acceptableCiphers,
    acceptableCurves: categoryData.edges[0]?.node.acceptableCurves,
    strongCiphers: categoryData.edges[0]?.node.strongCiphers,
    strongCurves: categoryData.edges[0]?.node.strongCurves,
    weakCiphers: categoryData.edges[0]?.node.weakCiphers,
    weakCurves: categoryData.edges[0]?.node.weakCurves,
  }

  return (
    <Box pb="2">
      <TrackerButton
        variant="primary"
        onClick={handleShowCategory}
        w={['100%', '25%']}
        mb="4"
      >
        <Heading as="h2" size="md">
          {categoryName.toUpperCase()}
        </Heading>
      </TrackerButton>
      <Collapse isOpen={showCategory}>
        {webSummary && (
          <Box>
            <TrackerButton
              variant="primary"
              onClick={handleShowSummary}
              w="100%"
            >
              <Trans>Summary</Trans>
            </TrackerButton>
            <Collapse isOpen={showSummary}>
              {JSON.stringify(webSummary)}
            </Collapse>
            <Divider />
          </Box>
        )}
        {tagDetails}
        {ciphers && (
          <Box>
            <Divider />
            <TrackerButton
              variant="primary"
              onClick={handleShowCiphers}
              w="100%"
            >
              <Trans>Ciphers</Trans>
            </TrackerButton>
            <Collapse isOpen={showCiphers}>{JSON.stringify(ciphers)}</Collapse>
          </Box>
        )}
      </Collapse>
    </Box>
  )
}

ScanCategoryDetails.propTypes = {
  categoryName: string,
  categoryData: object,
}

export default WithPseudoBox(ScanCategoryDetails)
