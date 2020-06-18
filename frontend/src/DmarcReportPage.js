import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/react-hooks'
import {
  DEMO_DMARC_REPORT_DETAIL_TABLES,
  DEMO_DMARC_REPORT_SUMMARY,
  DEMO_DMARC_REPORT_SUMMARY_LIST,
} from './graphql/queries'
import SummaryCard from './SummaryCard'
import DmarcTimeGraph from './DmarcTimeGraph'
import { Box, Text } from '@chakra-ui/core'
import DmarcReportTable from './DmarcReportTable'
import { Trans } from '@lingui/macro'
import { number } from 'prop-types'

export function DmarcReportPage({ ...props }) {
  const { summaryListResponsiveWidth } = props
  const { currentUser } = useUserState()

  const {
    loading: summaryLoading,
    error: summaryError,
    data: summaryData,
  } = useQuery(DEMO_DMARC_REPORT_SUMMARY, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: { domainSlug: 'cyber.gc.ca', period: 'LAST30DAYS', year: 2020 },
  })

  const { loading: barLoading, error: barError, data: barData } = useQuery(
    DEMO_DMARC_REPORT_SUMMARY_LIST,
    {
      context: {
        headers: {
          authorization: currentUser.jwt,
        },
      },
      variables: { domainSlug: 'cyber.gc.ca' },
    },
  )

  const {
    loading: tableLoading,
    error: tableError,
    data: tableData,
  } = useQuery(DEMO_DMARC_REPORT_DETAIL_TABLES, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: { domainSlug: 'cyber.gc.ca', period: 'LAST30DAYS', year: 2020 },
  })

  if (tableLoading || summaryLoading || barLoading) return <p>Loading...</p>
  // TODO: Properly handle these errors
  if (tableError || summaryError || barError) return <p>Error</p>

  const strengths = {
    strong: {
      types: ['fullPass'],
      name: 'Pass',
    },
    moderate: {
      types: ['partialPass'],
      name: 'Partial Pass',
    },
    weak: {
      types: ['fail'],
      name: 'Fail',
    },
  }

  // TODO: reportCardData.strengths and formattedBarData.strengths reference
  //  the same object, is this okay?
  const reportCardData = summaryData.dmarcReportSummary
  reportCardData.strengths = strengths

  const formattedBarData = {
    periods: barData.dmarcReportSummaryList.map((entry) => {
      return { month: entry.month, year: entry.year, ...entry.categoryTotals }
    }),
  }
  formattedBarData.strengths = strengths

  const detailTablesData = tableData.dmarcReportDetailTables.detailTables

  const fullPassData = detailTablesData.fullPass
  const spfFailureData = detailTablesData.spfFailure
  const spfMisalignedData = detailTablesData.spfMisaligned
  const dkimFailureData = detailTablesData.dkimFailure
  const dkimMisalignedData = detailTablesData.dkimMisaligned
  const dmarcFailureData = detailTablesData.dmarcFailure

  const initialSort = [{ id: 'totalMessages', desc: true }]

  const [
    sourceIpAddress,
    envelopeFrom,
    dkimDomains,
    dkimSelectors,
    totalMessages,
    countryCode,
    prefixOrg,
    dnsHost,
    spfDomains,
  ] = [
    { Header: 'sourceIpAddress', accessor: 'sourceIpAddress' },
    { Header: 'envelopeFrom', accessor: 'envelopeFrom' },
    { Header: 'dkimDomains', accessor: 'dkimDomains' },
    { Header: 'dkimSelectors', accessor: 'dkimSelectors' },
    { Header: 'totalMessages', accessor: 'totalMessages' },
    { Header: 'countryCode', accessor: 'countryCode' },
    { Header: 'prefixOrg', accessor: 'prefixOrg' },
    { Header: 'dnsHost', accessor: 'dnsHost' },
    { Header: 'spfDomains', accessor: 'spfDomains' },
  ]

  const fullPassColumns = [
    {
      Header: 'Fully Aligned by IP Address',
      hidden: true,
      columns: [
        sourceIpAddress,
        envelopeFrom,
        countryCode,
        prefixOrg,
        dnsHost,
        spfDomains,
        dkimDomains,
        dkimSelectors,
        totalMessages,
      ],
    },
  ]

  const spfFailureColumns = [
    {
      Header: 'SPF Failures by IP Address',
      hidden: true,
      columns: [
        sourceIpAddress,
        envelopeFrom,
        countryCode,
        prefixOrg,
        dnsHost,
        spfDomains,
        totalMessages,
      ],
    },
  ]

  const spfMisalignedColumns = [
    {
      Header: 'SPF Misalignment by IP Address',
      hidden: true,
      columns: [
        sourceIpAddress,
        envelopeFrom,
        countryCode,
        prefixOrg,
        dnsHost,
        spfDomains,
        totalMessages,
      ],
    },
  ]

  const dkimFailureColumns = [
    {
      Header: 'DKIM Failures by IP Address',
      hidden: true,
      columns: [
        sourceIpAddress,
        envelopeFrom,
        countryCode,
        prefixOrg,
        dnsHost,
        dkimDomains,
        dkimSelectors,
        totalMessages,
      ],
    },
  ]

  const dkimMisalignedColumns = [
    {
      Header: 'DKIM Misalignment by IP Address',
      hidden: true,
      columns: [
        sourceIpAddress,
        envelopeFrom,
        countryCode,
        prefixOrg,
        dnsHost,
        dkimDomains,
        dkimSelectors,
        totalMessages,
      ],
    },
  ]

  const dmarcFailureColumns = [
    {
      Header: 'DMARC Failures by IP Address',
      hidden: true,
      columns: [
        sourceIpAddress,
        envelopeFrom,
        countryCode,
        prefixOrg,
        dnsHost,
        spfDomains,
        dkimDomains,
        dkimSelectors,
        totalMessages,
      ],
    },
  ]

  const cardWidth = window.matchMedia('(max-width: 500px)').matches
    ? '100%'
    : window.matchMedia('(max-width: 800px)').matches
    ? '50%'
    : window.matchMedia('(max-width: 1200px)').matches
    ? '35%'
    : '20%'

  return (
    <Box width="100%">
      <Text>
        <Trans>
          *All data represented is mocked for demonstration purposes
        </Trans>
      </Text>
      <SummaryCard
        title="DMARC Report"
        description="Description of DMARC report"
        data={reportCardData}
        width={cardWidth}
        mx="auto"
      />
      <DmarcTimeGraph
        data={formattedBarData}
        width="100%"
        mx="auto"
        responsiveWidth={summaryListResponsiveWidth}
      />
      <DmarcReportTable
        data={fullPassData}
        columns={fullPassColumns}
        title="Fully Aligned by IP Address"
        initialSort={initialSort}
        mb="30px"
      />
      <DmarcReportTable
        data={spfFailureData}
        columns={spfFailureColumns}
        title="SPF Failures by IP Address"
        initialSort={initialSort}
        mb="30px"
      />
      <DmarcReportTable
        data={spfMisalignedData}
        columns={spfMisalignedColumns}
        title="SPF Misalignment by IP Address"
        initialSort={initialSort}
        mb="30px"
      />
      <DmarcReportTable
        data={dkimFailureData}
        columns={dkimFailureColumns}
        title="DKIM Failures by IP Address"
        initialSort={initialSort}
        mb="30px"
      />
      <DmarcReportTable
        data={dkimMisalignedData}
        columns={dkimMisalignedColumns}
        title="DKIM Misalignment by IP Address"
        initialSort={initialSort}
        mb="30px"
      />
      <DmarcReportTable
        data={dmarcFailureData}
        columns={dmarcFailureColumns}
        title="DMARC Failures by IP Address"
        initialSort={initialSort}
        mb="30px"
      />
    </Box>
  )
}

DmarcReportPage.propTypes = {
  // Need to allow summaryList ResponsiveContainer width as a set number for tests to work
  summaryListResponsiveWidth: number,
}
