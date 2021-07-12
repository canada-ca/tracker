import React, { useState } from 'react'
import { object, string } from 'prop-types'
import { Box, Collapse, Divider, Heading, Stack, Text } from '@chakra-ui/core'
import { TrackerButton } from './TrackerButton'
import { GuidanceTagList } from './GuidanceTagList'
import WithPseudoBox from './withPseudoBox'
import { t, Trans } from '@lingui/macro'

function ScanCategoryDetails({ categoryName, categoryData }) {
  const [showCategory, setShowCategory] = useState(true)
  const handleShowCategory = () => setShowCategory(!showCategory)
  const [showCiphers, setShowCiphers] = useState(true)
  const handleShowCiphers = () => setShowCiphers(!showCiphers)
  const [showCurves, setShowCurves] = useState(true)
  const handleShowCurves = () => setShowCurves(!showCurves)

  if (!categoryData)
    return (
      <Text fontWeight="bold" fontSize="2xl">
        <Trans>
          {t`No scan data available for ${categoryName.toUpperCase()}.`}
        </Trans>
      </Text>
    )

  console.log({ categoryData })

  const tagDetails =
    categoryName === 'dkim' ? (
      categoryData.results.edges ? (
        categoryData.results.edges.map(({ node }, idx) => {
          console.log({ node })
          return (
            <GuidanceTagList
              negativeTags={node.negativeGuidanceTags.edges}
              positiveTags={node.positiveGuidanceTags.edges}
              neutralTags={node.neutralGuidanceTags.edges}
              selector={node.selector}
              key={categoryName + idx}
            />
          )
        })
      ) : (
        categoryData.results.map((result, idx) => {
          return (
            <GuidanceTagList
              negativeTags={result.negativeGuidanceTags}
              positiveTags={result.positiveGuidanceTags}
              neutralTags={result.neutralGuidanceTags}
              selector={result.selector}
              key={categoryName + idx}
            />
          )
        })
      )
    ) : categoryData.negativeGuidanceTags.__typename ===
      'GuidanceTagConnection' ? (
      <GuidanceTagList
        negativeTags={categoryData.negativeGuidanceTags.edges}
        positiveTags={categoryData.positiveGuidanceTags.edges}
        neutralTags={categoryData.neutralGuidanceTags.edges}
        key={categoryName}
      />
    ) : (
      <GuidanceTagList
        negativeTags={categoryData.negativeGuidanceTags}
        positiveTags={categoryData.positiveGuidanceTags}
        neutralTags={categoryData.neutralGuidanceTags}
        key={categoryName}
      />
    )

  const webSummary =
    categoryName === 'https' ? (
      <Box bg="gray.100" px="2" py="1">
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Implementation:</Trans>
          </Text>
          <Text>{categoryData?.implementation}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Enforcement:</Trans>
          </Text>
          <Text>{categoryData?.enforced}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>HSTS Status:</Trans>
          </Text>
          <Text>{categoryData?.hsts}</Text>
        </Stack>
        {categoryData?.hstsAge && (
          <Stack isInline>
            <Text fontWeight="bold">
              <Trans>HSTS Age:</Trans>
            </Text>
            <Text>{categoryData?.hstsAge}</Text>
          </Stack>
        )}
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Preloaded Status:</Trans>
          </Text>
          <Text> {categoryData?.preloaded}</Text>
        </Stack>
      </Box>
    ) : categoryName === 'ssl' ? (
      <Box bg="gray.100" px="2" py="1">
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>CCS Injection Vulnerability:</Trans>
          </Text>
          <Text>{categoryData?.ccsInjectionVulnerable ? t`Yes` : t`No`}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Heartbleed Vulnerability:</Trans>
          </Text>
          <Text>{categoryData?.heartbleedVulnerable ? t`Yes` : t`No`}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Supports ECDH Key Exchange:</Trans>
          </Text>
          <Text>{categoryData?.supportsEcdhKeyExchange ? t`Yes` : t`No`}</Text>
        </Stack>
      </Box>
    ) : null

  const mapCiphers = (cipherList) => {
    return (
      <Box px="2">
        {cipherList.length > 0 ? (
          cipherList.map((cipher, id) => {
            return (
              <Text key={id} isTruncated fontSize={['sm', 'md']}>
                {cipher}
              </Text>
            )
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
          {mapCiphers(categoryData?.strongCiphers)}
        </Box>
        <Divider />
        <Box bg="moderateMuted">
          <Box bg="moderate" color="white" px="2">
            <Text fontWeight="bold">
              <Trans>Acceptable Ciphers:</Trans>
            </Text>
          </Box>
          {mapCiphers(categoryData?.acceptableCiphers)}
        </Box>
        <Divider />
        <Box bg="weakMuted">
          <Box bg="weak" color="white" px="2">
            <Text fontWeight="bold">
              <Trans>Weak Ciphers:</Trans>
            </Text>
          </Box>
          {mapCiphers(categoryData?.weakCiphers)}
        </Box>
      </Stack>
    </Box>
  )

  const curves = categoryName === 'ssl' && (
    <Box>
      <Stack>
        <Box bg="strongMuted">
          <Box bg="strong" color="white" px="2">
            <Text fontWeight="bold">
              <Trans>Strong Curves:</Trans>
            </Text>
          </Box>
          {mapCiphers(categoryData?.strongCurves)}
        </Box>
        <Divider />
        <Box bg="moderateMuted">
          <Box bg="moderate" color="white" px="2">
            <Text fontWeight="bold">
              <Trans>Acceptable Curves:</Trans>
            </Text>
          </Box>
          {mapCiphers(categoryData?.acceptableCurves)}
        </Box>
        <Divider />
        <Box bg="weakMuted">
          <Box bg="weak" color="white" px="2">
            <Text fontWeight="bold">
              <Trans>Weak Curves:</Trans>
            </Text>
          </Box>
          {mapCiphers(categoryData?.weakCurves)}
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
        {curves && (
          <Box>
            <Divider />
            <TrackerButton
              variant="primary"
              onClick={handleShowCurves}
              w="100%"
              mb="2"
            >
              <Trans>Curves</Trans>
            </TrackerButton>
            <Collapse isOpen={showCurves}>{curves}</Collapse>
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
