import React, {useState} from 'react'
import { object, string } from 'prop-types'
import {Accordion, Box, Button, Divider, Flex, Stack, Text} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'

import { GuidanceTagList } from './GuidanceTagList'

import { TrackerAccordionItem as AccordionItem } from '../components/TrackerAccordionItem'

export function ScanCategoryDetails({ categoryName, categoryData }) {
  if (!categoryData)
    return (
      <Text fontWeight="bold" fontSize="2xl">
        <Trans>No scan data available for {categoryName.toUpperCase()}.</Trans>
      </Text>
    )

  const tagDetails =
    categoryName === 'dkim' ?  (
        categoryData?.selectors?.map((result, idx) => {
          return (
            <GuidanceTagList
              negativeTags={result.negativeTags}
              positiveTags={result.positiveTags}
              neutralTags={result.neutralTags}
              selector={result.selector}
              key={categoryName + idx}
            />
          )
        })
    ) : (
      <GuidanceTagList
        negativeTags={categoryData.negativeTags}
        positiveTags={categoryData.positiveTags}
        neutralTags={categoryData.neutralTags}
        key={categoryName}
      />
    )

  const webSummary =
    categoryName === 'https' ? (
      <Box bg="gray.100" px="2" py="1">
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>HTTP Live:</Trans>
          </Text>
          <Text>{String(categoryData?.httpLive)}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>HTTPS Live:</Trans>
          </Text>
          <Text>{String(categoryData?.httpsLive)}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>HTTP Immediately Upgrades to HTTPS:</Trans>
          </Text>
          <Text>{String(categoryData?.httpImmediatelyUpgrades)}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>HTTP Eventually Upgrades to HTTPS:</Trans>
          </Text>
          <Text>{String(categoryData?.httpEventuallyUpgrades)}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>HTTPS Immediately Downgrades:</Trans>
          </Text>
          <Text>{String(categoryData?.httpsImmediatelyDowngrades)}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>HTTPS Eventually Downgrades:</Trans>
          </Text>
          <Text>{String(categoryData?.httpsEventuallyDowngrades)}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>HSTS Max Age:</Trans>
          </Text>
          <Text>{String(categoryData?.hstsParsed?.maxAge)}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>HSTS Include Subdomains:</Trans>
          </Text>
          <Text> {String(categoryData?.hstsParsed?.includeSubdomains)}</Text>
        </Stack>
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>HSTS Preloaded Status:</Trans>
          </Text>
          <Text> {String(categoryData?.hstsParsed?.preload)}</Text>
        </Stack>
      </Box>
    ) : categoryName === 'ssl' ? (
      <Box bg="gray.100" px="2" py="1">
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Supports ECDH Key Exchange:</Trans>
          </Text>
          <Text>{categoryData?.supportsEcdhKeyExchange ? t`Yes` : t`No`}</Text>
        </Stack>
      </Box>
    ) : null

  const strongCiphers = []
  const acceptableCiphers = []
  const weakCiphers = []


  for (const protocol in categoryData?.acceptedCipherSuites) {
    for (const cipherSuite of categoryData?.acceptedCipherSuites[protocol]) {
      if (cipherSuite.strength === t`strong`) strongCiphers.push(cipherSuite.name)
      if (cipherSuite.strength === t`acceptable`) acceptableCiphers.push(cipherSuite.name)
      if (cipherSuite.strength === t`weak`) weakCiphers.push(cipherSuite.name)
    }
  }

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
            <Text fontWeight="bold" variant="shadow">
              <Trans>Strong Ciphers:</Trans>
            </Text>
          </Box>
          {mapCiphers(strongCiphers)}
        </Box>
        <Divider />
        <Box bg="moderateMuted">
          <Box bg="moderate" color="white" px="2">
            <Text fontWeight="bold" variant="shadow">
              <Trans>Acceptable Ciphers:</Trans>
            </Text>
          </Box>
          {mapCiphers(acceptableCiphers)}
        </Box>
        <Divider />
        <Box bg="weakMuted">
          <Box bg="weak" color="white" px="2">
            <Text fontWeight="bold" variant="shadow">
              <Trans>Weak Ciphers:</Trans>
            </Text>
          </Box>
          {mapCiphers(weakCiphers)}
        </Box>
      </Stack>
    </Box>
  )

  const strongCurves = []
  const acceptableCurves = []
  const weakCurves = []

  if (categoryData?.acceptedEllipticCurves !== undefined) {
    categoryData?.acceptedEllipticCurves.forEach((curve) => {
      if (curve.strength === t`strong`) strongCurves.push(curve.name)
      if (curve.strength === t`acceptable`) acceptableCurves.push(curve.name)
      if (curve.strength === t`weak`) weakCurves.push(curve.name)
    })
  }

  const curves = categoryName === 'ssl' && (
    <Box>
      <Stack>
        <Box bg="strongMuted">
          <Box bg="strong" color="white" px="2">
            <Text fontWeight="bold" variant="shadow">
              <Trans>Strong Curves:</Trans>
            </Text>
          </Box>
          {mapCiphers(strongCurves)}
        </Box>
        <Divider />
        <Box bg="moderateMuted">
          <Box bg="moderate" color="white" px="2">
            <Text fontWeight="bold" variant="shadow">
              <Trans>Acceptable Curves:</Trans>
            </Text>
          </Box>
          {mapCiphers(acceptableCurves)}
        </Box>
        <Divider />
        <Box bg="weakMuted">
          <Box bg="weak" color="white" px="2">
            <Text fontWeight="bold" variant="shadow">
              <Trans>Weak Curves:</Trans>
            </Text>
          </Box>
          {mapCiphers(weakCurves)}
        </Box>
      </Stack>
    </Box>
  )

  return (
    <AccordionItem
      buttonLabel={categoryName === 'ssl' ? 'TLS' : categoryName.toUpperCase()}
    >
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
