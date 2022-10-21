import React from 'react'
import PropTypes from 'prop-types'
import { SubdomainWarning } from '../domains/SubdomainWarning'
import { ScanCard } from './NewScanCard'
import { t } from '@lingui/macro'
import { ScanDetails } from './NewScanCategoryDetails'
import { GuidanceTagList } from './GuidanceTagList'
import { StrengthCategory } from './StrengthCategory'
import { Accordion } from '@chakra-ui/react'
import { DetailList } from './DetailList'

const WebGuidance = ({ webScan }) => {
  const httpsScan = webScan.https.edges[0].node
  const tlsScan = webScan.ssl.edges[0].node

  const httpDetailList = []
  httpDetailList.push({
    category: t`Implementation`,
    description: httpsScan.implementation,
  })
  httpDetailList.push({
    category: t`Enforcement`,
    description: httpsScan.enforced,
  })

  return (
    <>
      <SubdomainWarning mb={4} />
      <ScanCard
        description={t`Web Scan Results`}
        title={t`Results for scans of web technologies (TLS, HTTPS).`}
      >
        <ScanDetails title={t`HTTPS`}>
          <DetailList details={httpDetailList} />
          <GuidanceTagList
            positiveTags={httpsScan.positiveGuidanceTags.edges}
            neutralTags={httpsScan.neutralGuidanceTags.edges}
            negativeTags={httpsScan.negativeGuidanceTags.edges}
          />
        </ScanDetails>
        <ScanDetails title={t`TLS`}>
          <GuidanceTagList
            positiveTags={tlsScan.positiveGuidanceTags.edges}
            neutralTags={tlsScan.neutralGuidanceTags.edges}
            negativeTags={tlsScan.negativeGuidanceTags.edges}
          />
          <Accordion allowMultiple defaultIndex={[0, 1]}>
            <ScanDetails title={t`Ciphers`}>
              <StrengthCategory
                type="ciphers"
                strength="strong"
                items={tlsScan.strongCiphers}
              />
              <StrengthCategory
                type="ciphers"
                strength="acceptable"
                items={tlsScan.acceptableCiphers}
              />
              <StrengthCategory
                type="ciphers"
                strength="weak"
                items={tlsScan.weakCiphers}
              />
            </ScanDetails>

            <ScanDetails title={t`Curves`}>
              <StrengthCategory
                type="ciphers"
                strength="strong"
                items={tlsScan.strongCiphers}
              />
              <StrengthCategory
                type="ciphers"
                strength="acceptable"
                items={tlsScan.acceptableCiphers}
              />
              <StrengthCategory
                type="ciphers"
                strength="weak"
                items={tlsScan.weakCiphers}
              />
            </ScanDetails>
          </Accordion>
        </ScanDetails>
      </ScanCard>
    </>
  )
}

WebGuidance.propTypes = {
  webScan: PropTypes.object.isRequired,
}

export default WebGuidance
