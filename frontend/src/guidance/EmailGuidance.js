import React from 'react'
import PropTypes from 'prop-types'
import { SubdomainWarning } from '../domains/SubdomainWarning'
import { ScanCard } from './NewScanCard'
import { t } from '@lingui/macro'
import { ScanDetails } from './NewScanCategoryDetails'
import { GuidanceTagList } from './GuidanceTagList'

const EmailGuidance = ({ emailScan }) => {
  const dmarcScan = emailScan.dmarc.edges[0].node
  const spfScan = emailScan.spf.edges[0].node
  const dkimScan = emailScan.dkim.edges[0].node.results.edges[0].node

  return (
    <>
      <ScanCard
        description={t`Email Scan Results`}
        title={t`Results for scans of email technologies (DMARC, SPF, DKIM).`}
      >
        <ScanDetails title={`DMARC`}>
          <GuidanceTagList
            positiveTags={dmarcScan.positiveGuidanceTags.edges}
            neutralTags={dmarcScan.neutralGuidanceTags.edges}
            negativeTags={dmarcScan.negativeGuidanceTags.edges}
          />
        </ScanDetails>
        <ScanDetails title={`SPF`}>
          <GuidanceTagList
            positiveTags={spfScan.positiveGuidanceTags.edges}
            neutralTags={spfScan.neutralGuidanceTags.edges}
            negativeTags={spfScan.negativeGuidanceTags.edges}
          />
        </ScanDetails>
        <ScanDetails title={`DKIM`}>
          <GuidanceTagList
            positiveTags={dkimScan.positiveGuidanceTags.edges}
            neutralTags={dkimScan.neutralGuidanceTags.edges}
            negativeTags={dkimScan.negativeGuidanceTags.edges}
          />
        </ScanDetails>
      </ScanCard>
    </>
  )
}

EmailGuidance.propTypes = {
  emailScan: PropTypes.object.isRequired,
}

export default EmailGuidance
