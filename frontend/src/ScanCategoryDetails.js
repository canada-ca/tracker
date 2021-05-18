import React, { useState } from 'react'
import { object, string } from 'prop-types'
import { Box, Heading, Collapse, Divider, Text, Stack } from '@chakra-ui/core'
import { TrackerButton } from './TrackerButton'
import { GuidanceTagList } from './GuidanceTagList'
import WithPseudoBox from './withPseudoBox'
import { Trans, t } from '@lingui/macro'

function ScanCategoryDetails({ categoryName, categoryData }) {
  const [showCategory, setShowCategory] = useState(true)
  const handleShowCategory = () => setShowCategory(!showCategory)
  const [showSummary, setShowSummary] = useState(true)
  const handleShowSummary = () => setShowSummary(!showSummary)
  const [showCiphers, setShowCiphers] = useState(true)
  const handleShowCiphers = () => setShowCiphers(!showCiphers)

  const data = categoryData.edges[0]?.node

  const tagDetails =
    categoryName === 'dkim' ? (
      data.results.edges.map(({ node }, idx) => (
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
        negativeTags={data.negativeGuidanceTags.edges}
        positiveTags={data.positiveGuidanceTags.edges}
        neutralTags={data.neutralGuidanceTags.edges}
        key={categoryName}
      />
    )

  const webSummary =
    categoryName === 'https' ? (
      <Box>
        <Text>Implementation: {data?.implementation}</Text>
        <Text>Enforced: {data?.enforced}</Text>
        <Text>HSTS: {data?.hsts}</Text>
        <Text>HSTS Age: {data?.hstsAge}</Text>
        <Text>Preloaded: {data?.preloaded}</Text>
      </Box>
    ) : categoryName === 'ssl' ? (
      <Box>
        <Text>
          CCS Injection Vulnerability:{' '}
          {data?.ccsInjectionVulnerable ? t`VULNERABLE` : t`SECURE`}
        </Text>
        <Text>
          Heartbleed Vulnerability:{' '}
          {data?.heartbleedVulnerable ? t`VULNERABLE` : t`SECURE`}
        </Text>
        <Text>
          Supports ECDH Key ExchangeL{' '}
          {data?.supportsEcdhKeyExchange ? t`YES` : t`NO`}
        </Text>
      </Box>
    ) : null

  const ciphers = categoryName === 'ssl' && (
    <Box>
      <Stack>
        <Text>Strong Ciphers: {data?.strongCiphers}</Text>
        <Text>Acceptable Ciphers: {data?.acceptableCiphers}</Text>
        <Text>Weak Ciphers: {data?.weakCiphers}</Text>
      </Stack>
      <Divider borderColor="gray.900" />
      <Stack>
        <Text>Strong Curves: {data?.strongCurves}</Text>
        <Text>Acceptable Curves: {data?.acceptableCurves}</Text>
        <Text>Weak Curves: {data?.weakCurves}</Text>
      </Stack>
    </Box>
  )

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
            <Collapse isOpen={showSummary}>{webSummary}</Collapse>
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
              <Trans>Ciphers & Curves</Trans>
            </TrackerButton>
            <Collapse isOpen={showCiphers}>{ciphers}</Collapse>
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
