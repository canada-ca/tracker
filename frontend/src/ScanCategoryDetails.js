import React from 'react'
import { object, string } from 'prop-types'
import { Accordion, Box, Divider, Stack, Text } from '@chakra-ui/react'
import { GuidanceTagList } from './GuidanceTagList'
import { t, Trans } from '@lingui/macro'
import { TrackerAccordionItem as AccordionItem } from './TrackerAccordionItem'

export default function ScanCategoryDetails({ categoryName, categoryData }) {
  if (!categoryData)
    return (
      <Text fontWeight="bold" fontSize="2xl">
        <Trans>No scan data available for ${categoryName.toUpperCase()}.</Trans>
      </Text>
    )

  const tagDetails =
    categoryName === 'dkim' ? (
      categoryData?.results?.edges ? (
        categoryData.results.edges.map(({ node }, idx) => {
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
        categoryData?.results?.map((result, idx) => {
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
              <Text key={id} isTruncated fontSize={{ base: 'sm', md: 'md' }}>
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
    <AccordionItem buttonLabel={categoryName.toUpperCase()}>
      {webSummary}
      <Divider />
      {tagDetails}
      <Accordion allowMultiple defaultIndex={[0, 1]}>
        {ciphers && (
          <AccordionItem buttonLabel={t`Ciphers`}>{ciphers}</AccordionItem>
        )}
        {curves && (
          <AccordionItem buttonLabel={t`Curves`}>{curves}</AccordionItem>
        )}
      </Accordion>
    </AccordionItem>
  )
}

ScanCategoryDetails.propTypes = {
  categoryName: string,
  categoryData: object,
}
