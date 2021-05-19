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
  // const [showSummary, setShowSummary] = useState(true)
  // const handleShowSummary = () => setShowSummary(!showSummary)
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
      <Box bg="gray.200" px="2">
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Implementation:</Trans>
          </Text>
          <Text>{data?.implementation}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Enforcement:</Trans>
          </Text>
          <Text>{data?.enforced}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>HSTS Status:</Trans>
          </Text>
          <Text>{data?.hsts}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>HSTS Age:</Trans>
          </Text>
          <Text>{data?.hstsAge}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Preloaded Status:</Trans>
          </Text>
          <Text> {data?.preloaded}</Text>
        </Stack>
      </Box>
    ) : categoryName === 'ssl' ? (
      <Box bg="gray.200" px="2">
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>CCS Injection Vulnerability:</Trans>
          </Text>
          <Text>{data?.ccsInjectionVulnerable ? t`Yes` : t`No`}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Heartbleed Vulnerability:</Trans>
          </Text>
          <Text>{data?.heartbleedVulnerable ? t`Yes` : t`No`}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Supports ECDH Key Exchange:</Trans>
          </Text>
          <Text>{data?.supportsEcdhKeyExchange ? t`Yes` : t`No`}</Text>
        </Stack>
      </Box>
    ) : null

  const mapCiphers = (cipherList) => {
    return (
      <Box px="2">
        {cipherList.length > 0 ? (
          cipherList.map((cipher, id) => {
            return <Text key={id}>{cipher}</Text>
          })
        ) : (
          <Text>
            <Trans>None</Trans>
          </Text>
        )}
      </Box>
    )
  }

  const ciphers = categoryName === 'ssl' && (
    <Box>
      <Stack>
        <Box bg="strongMuted">
          <Box bg="strong" color="white" px="2">
            <Text fontWeight="bold">
              <Trans>Strong Ciphers:</Trans>
            </Text>
          </Box>
          {mapCiphers(data?.strongCiphers)}
        </Box>
        <Divider />
        <Box bg="moderateMuted">
          <Box bg="moderate" color="white" px="2">
            <Text fontWeight="bold">
              <Trans>Acceptable Ciphers:</Trans>
            </Text>
          </Box>
          {mapCiphers(data?.acceptableCiphers)}
        </Box>
        <Divider />
        <Box bg="weakMuted">
          <Box bg="weak" color="white" px="2">
            <Text fontWeight="bold">
              <Trans>Weak Ciphers:</Trans>
            </Text>
          </Box>
          {mapCiphers(data?.weakCiphers)}
        </Box>
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
        {webSummary}
        <Divider />
        {tagDetails}
        {ciphers && (
          <Box>
            <Divider />
            <TrackerButton
              variant="primary"
              onClick={handleShowCiphers}
              w="100%"
              mb="2"
            >
              <Trans>Ciphers</Trans>
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
