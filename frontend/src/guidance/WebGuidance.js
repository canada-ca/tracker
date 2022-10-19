import React from 'react'
import PropTypes from 'prop-types'
import { SubdomainWarning } from '../domains/SubdomainWarning'
import { ScanCard } from './NewScanCard'
import { t } from '@lingui/macro'
import { ScanDetails } from './NewScanCategoryDetails'
import { GuidanceTagList } from './GuidanceTagList'

const WebGuidance = ({ webScan }) => {
  const httpsScan = webScan.https.edges[0].node
  const tlsScan = webScan.ssl.edges[0].node

  return (
    <>
      <SubdomainWarning mb={4} />
      <ScanCard
        description={t`Web Scan Results`}
        title={t`Results for scans of web technologies (TLS, HTTPS).`}
      >
        <ScanDetails title={`HTTPS`}>
          <GuidanceTagList
            positiveTags={httpsScan.positiveGuidanceTags.edges}
            neutralTags={httpsScan.neutralGuidanceTags.edges}
            negativeTags={httpsScan.negativeGuidanceTags.edges}
          />
        </ScanDetails>
        <ScanDetails title={`TLS`}>
          <GuidanceTagList
            positiveTags={tlsScan.positiveGuidanceTags.edges}
            neutralTags={tlsScan.neutralGuidanceTags.edges}
            negativeTags={tlsScan.negativeGuidanceTags.edges}
          />
        </ScanDetails>
      </ScanCard>
    </>
  )
}

WebGuidance.propTypes = {
  webScan: PropTypes.object.isRequired,
}

export default WebGuidance
