import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/client'
import { DMARC_REPORT_SUMMARY_TABLE } from './graphql/queries'
import { Box, Heading } from '@chakra-ui/core'
import DmarcReportTable from './DmarcReportTable'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'

export default function DmarcByDomainPage() {
  const { currentUser } = useUserState()
  const { i18n } = useLingui()

  const {
    loading: tableLoading,
    error: tableError,
    data: tableData,
  } = useQuery(DMARC_REPORT_SUMMARY_TABLE, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      period: 'LAST30DAYS',
      year: '2020',
    },
  })

  if (tableLoading) return <p>Loading...</p>
  // TODO: Properly handle these errors
  if (tableError) return <p>Error</p>

  // Initial sorting category for detail tables
  const initialSort = [{ id: 'totalMessages', desc: true }]

  const [
    domain,
    totalMessages,
    fullPassPercentage,
    passSpfOnlyPercentage,
    passDkimOnlyPercentage,
    failPercentage,
  ] = [
    { Header: i18n._(t`Domain`), accessor: 'domain' },
    { Header: i18n._(t`Total Messages`), accessor: 'totalMessages' },
    {
      Header: i18n._(t`Full Pass %`),
      accessor: 'fullPassPercentage',
    },
    {
      Header: i18n._(t`Fail DKIM %`),
      accessor: 'passSpfOnlyPercentage',
    },
    {
      Header: i18n._(t`Fail SPF %`),
      accessor: 'passDkimOnlyPercentage',
    },
    { Header: i18n._(t`Full Fail %`), accessor: 'failPercentage' },
  ]

  const percentageColumns = [
    {
      Header: i18n._(t`DMARC Messages`),
      hidden: true,
      columns: [
        domain,
        totalMessages,
        fullPassPercentage,
        passDkimOnlyPercentage,
        passSpfOnlyPercentage,
        failPercentage,
      ],
    },
  ]

  return (
    <Box width="100%">
      <Heading as="h1" textAlign="center" size="lg" mb="4px">
        <Trans>DMARC Messages</Trans>
      </Heading>

      <DmarcReportTable
        data={tableData.dmarcReportSummaryTable.domains}
        columns={percentageColumns}
        title={i18n._(t`Pass/Fail Ratios by Domain`)}
        initialSort={initialSort}
        mb="30px"
        hideTitleButton={true}
        linkColumns={[{ column: 'domain', isExternal: false }]}
        prependLink="domains/"
        appendLink="/dmarc-report"
      />
    </Box>
  )
}

DmarcByDomainPage.propTypes = {}
