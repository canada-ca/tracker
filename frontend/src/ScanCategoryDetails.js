import React, { useState } from 'react'
import { object, string } from 'prop-types'
import {
  Box,
  Button,
  Collapse,
  Divider,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react'
import { GuidanceTagList } from './GuidanceTagList'
import WithWrapperBox from './WithWrapperBox'
import { t, Trans } from '@lingui/macro'

function ScanCategoryDetails({ categoryName, categoryData }) {
  const [showCategory, setShowCategory] = useState(true)
  const handleShowCategory = () => setShowCategory(!showCategory)
  const [showCiphers, setShowCiphers] = useState(true)
  const handleShowCiphers = () => setShowCiphers(!showCiphers)
  const [showCurves, setShowCurves] = useState(true)
  const handleShowCurves = () => setShowCurves(!showCurves)

  const data = categoryData.edges[0]?.node

  if (!data)
    return (
      <Text fontWeight="bold" fontSize="2xl">
        <Trans>
          {t`No scan data available for ${categoryName.toUpperCase()}.`}
        </Trans>
      </Text>
    )

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
      <Box bg="gray.100" px="2" py="1">
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
        {data?.hstsAge && (
          <Stack isInline>
            <Text fontWeight="bold">
              <Trans>HSTS Age:</Trans>
            </Text>
            <Text>{data?.hstsAge}</Text>
          </Stack>
        )}
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Preloaded Status:</Trans>
          </Text>
          <Text> {data?.preloaded}</Text>
        </Stack>
      </Box>
    ) : categoryName === 'ssl' ? (
      <Box bg="gray.100" px="2" py="1">
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

  const curves = categoryName === 'ssl' && (
    <Box>
      <Stack>
        <Box bg="strongMuted">
          <Box bg="strong" color="white" px="2">
            <Text fontWeight="bold">
              <Trans>Strong Curves:</Trans>
            </Text>
          </Box>
          {mapCiphers(data?.strongCurves)}
        </Box>
        <Divider />
        <Box bg="moderateMuted">
          <Box bg="moderate" color="white" px="2">
            <Text fontWeight="bold">
              <Trans>Acceptable Curves:</Trans>
            </Text>
          </Box>
          {mapCiphers(data?.acceptableCurves)}
        </Box>
        <Divider />
        <Box bg="weakMuted">
          <Box bg="weak" color="white" px="2">
            <Text fontWeight="bold">
              <Trans>Weak Curves:</Trans>
            </Text>
          </Box>
          {mapCiphers(data?.weakCurves)}
        </Box>
      </Stack>
    </Box>
  )

  return (
    <Box pb="2">
      <Button
        variant="primary"
        onClick={handleShowCategory}
        w={['100%', '25%']}
        mb="4"
      >
        <Heading as="h2" size="md">
          {categoryName.toUpperCase()}
        </Heading>
      </Button>
      <Collapse isOpen={showCategory}>
        {webSummary}
        <Divider />
        {tagDetails}
        {ciphers && (
          <Box>
            <Divider />
            <Button
              variant="primary"
              onClick={handleShowCiphers}
              w="100%"
              mb="2"
            >
              <Trans>Ciphers</Trans>
            </Button>
            <Collapse isOpen={showCiphers}>{ciphers}</Collapse>
          </Box>
        )}
        {curves && (
          <Box>
            <Divider />
            <Button
              variant="primary"
              onClick={handleShowCurves}
              w="100%"
              mb="2"
            >
              <Trans>Curves</Trans>
            </Button>
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

export default WithWrapperBox(ScanCategoryDetails)
