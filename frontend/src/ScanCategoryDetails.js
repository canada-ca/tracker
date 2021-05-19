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
        <Stack isInline>
          <Text fontWeight="bold">Implementation:</Text>
          <Text>{data?.implementation}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">Enforcement: </Text>
          <Text>{data?.enforced}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">HSTS Status:</Text>
          <Text>{data?.hsts}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">HSTS Age:</Text>
          <Text>{data?.hstsAge}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">Preloaded Status:</Text>
          <Text> {data?.preloaded}</Text>
        </Stack>
      </Box>
    ) : categoryName === 'ssl' ? (
      <Box>
        <Stack isInline>
          <Text fontWeight="bold">CCS Injection Vulnerability:</Text>
          <Text>
            {data?.ccsInjectionVulnerable ? t`Vulnerable` : t`Secure`}
          </Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">Heartbleed Vulnerability:</Text>
          <Text>{data?.heartbleedVulnerable ? t`Vulnerable` : t`Secure`}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">Supports ECDH Key Exchange:</Text>
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
          <Text>None</Text>
        )}
      </Box>
    )
  }

  const ciphers = categoryName === 'ssl' && (
    <Box>
      <Stack>
        <Box bg="strongMuted">
          <Box bg="strong" color="white" px="2">
            <Text fontWeight="bold">Strong Ciphers:</Text>
          </Box>
          {mapCiphers(data?.strongCiphers)}
        </Box>
        <Divider />
        <Box bg="moderateMuted">
          <Box bg="moderate" color="white" px="2">
            <Text fontWeight="bold">Acceptable Ciphers:</Text>
          </Box>
          {mapCiphers(data?.acceptableCiphers)}
        </Box>
        <Divider />
        <Box bg="weakMuted">
          <Box bg="weak" color="white" px="2">
            <Text fontWeight="bold">Weak Ciphers:</Text>
          </Box>
          {mapCiphers(data?.weakCiphers)}
        </Box>
      </Stack>
      {/* <Divider />
      <Stack>
        <Box bg="strongMuted">
          <Box bg="strong" color="white" px="2">
            <Text fontWeight="bold">Strong Curves:</Text>
          </Box>
          {mapCiphers(data?.strongCurves)}
        </Box>
        <Box bg="moderateMuted">
          <Box bg="moderate" color="white" px="2">
            <Text fontWeight="bold">Acceptable Curves:</Text>
          </Box>
          {mapCiphers(data?.acceptableCurves)}
        </Box>
        <Box bg="weakMuted">
          <Box bg="weak" color="white" px="2">
            <Text fontWeight="bold">Weak Curves:</Text>
          </Box>
          {mapCiphers(data?.weakCurves)}
        </Box>
      </Stack> */}
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
              mb="2"
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
              mb="2"
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
