import React from 'react'
import PropTypes from 'prop-types'
import { SubdomainWarning } from '../domains/SubdomainWarning'
import { ScanCard } from './ScanCard'
import { t } from '@lingui/macro'
import { ScanDetails } from './ScanDetails'
import { GuidanceTagList } from './GuidanceTagList'
import { StrengthCategory } from './StrengthCategory'
import { Accordion, Box, Stack, Text } from '@chakra-ui/react'
import { DetailList } from './DetailList'
import { CheckCircleIcon, WarningTwoIcon } from '@chakra-ui/icons'

const WebGuidance = ({ webScan, sslStatus, httpsStatus }) => {
  const httpsScan = webScan?.edges[0]?.node?.results[0]?.results?.connectionResults
  const tlsScan = webScan?.edges[0]?.node?.results[0]?.results?.tlsResult

  const httpDetailList = []
  httpDetailList.push({
    category: t`Implementation`,
    description: httpsScan.implementation,
  })
  httpDetailList.push({
    category: t`Enforcement`,
    description: httpsScan.enforced,
  })

  const getCiphersByStrength = (cipherList, strength) => {
    return cipherList.reduce((acc, curr) => {
      if (curr.strength === strength) acc.push(curr.name)
      return acc
    })
  }

  const allCipherSuites = Object.values(tlsScan.acceptedCipherSuites).reduce((acc, curr) => {
    return [...acc, ...curr]
  }, [])

  const strongCipherSuites = getCiphersByStrength(allCipherSuites, 'strong')
  const acceptableCipherSuites = getCiphersByStrength(allCipherSuites, 'acceptable')
  const weakCipherSuites = getCiphersByStrength(allCipherSuites, 'weak')

  const complianceInfo = [sslStatus, httpsStatus].every((status) => status === 'PASS') ? (
    <Stack isInline align="center" px="2">
      <CheckCircleIcon color="strong" size="icons.md" />
      <Text fontWeight="bold" fontSize="2xl">
        Web Sites and Services Management Configuration Requirements Compliant
      </Text>
    </Stack>
  ) : (
    <Stack isInline align="center" px="2">
      <WarningTwoIcon color="moderate" size="icons.md" />
      <Text fontWeight="bold" fontSize="2xl">
        Changes required for Web Sites and Services Management Configuration Requirements compliance
      </Text>
    </Stack>
  )

  return (
    <>
      <SubdomainWarning mb={4} />
      <ScanCard description={t`Web Scan Results`} title={t`Results for scans of web technologies (TLS, HTTPS).`}>
        <Box pb="1">{complianceInfo}</Box>
        <ScanDetails title={t`HTTPS`}>
          <DetailList details={httpDetailList} />
          <GuidanceTagList
            positiveTags={httpsScan.positiveTags}
            neutralTags={httpsScan.neutralTags}
            negativeTags={httpsScan.negativeTags}
          />
        </ScanDetails>
        <ScanDetails title={t`TLS`}>
          <GuidanceTagList
            positiveTags={tlsScan.positiveTags}
            neutralTags={tlsScan.neutralTags}
            negativeTags={tlsScan.negativeTags}
          />
          <Accordion allowMultiple defaultIndex={[0, 1]}>
            <ScanDetails title={t`Ciphers`}>
              <StrengthCategory title={t`Strong Ciphers:`} strength="strong" items={strongCipherSuites} />
              <StrengthCategory title={t`Acceptable Ciphers:`} strength="acceptable" items={acceptableCipherSuites} />
              <StrengthCategory title={t`Weak Ciphers:`} strength="weak" items={weakCipherSuites} />
            </ScanDetails>

            <ScanDetails title={t`Curves`}>
              <StrengthCategory title={t`Strong Curves:`} strength="strong" items={tlsScan.strongCiphers} />
              <StrengthCategory title={t`Acceptable Curves:`} strength="acceptable" items={tlsScan.acceptableCiphers} />
              <StrengthCategory title={t`Weak Curves:`} strength="weak" items={tlsScan.weakCiphers} />
            </ScanDetails>
          </Accordion>
        </ScanDetails>
      </ScanCard>
    </>
  )
}

WebGuidance.propTypes = {
  webScan: PropTypes.object.isRequired,
  httpsStatus: PropTypes.string,
  sslStatus: PropTypes.string,
}

export default WebGuidance
