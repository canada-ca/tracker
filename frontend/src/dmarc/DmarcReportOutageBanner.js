import React from 'react'
import { NotificationBanner } from '../app/NotificationBanner'
import { AlertDescription, AlertTitle, Box } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'

export function DmarcReportOutageBanner() {
  return (
    <NotificationBanner status="warning" bannerId="dmarc-report-outage-2">
      <Box>
        <AlertTitle>
          <Trans>Note:</Trans>
        </AlertTitle>
        <AlertDescription>
          <Trans>
            There is a gap in historical DMARC data between December 20, 2024 and January 21, 2025 due to a service
            disruption. This does not affect current DMARC reporting, and all data before and after this period remains
            complete and accurate.
          </Trans>
        </AlertDescription>
      </Box>
    </NotificationBanner>
  )
}
