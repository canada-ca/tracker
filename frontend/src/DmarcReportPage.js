import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/react-hooks'
import {
  GET_ALIGNED_BY_IP,
  GET_SPF_FAILURES,
  GET_SPF_MISALIGN,
  GET_DKIM_FAILURES,
  GET_DKIM_MISALIGN,
  GET_DMARC_FAILURES,
  GET_DMARC_REPORT_BAR_GRAPH,
  GET_DMARC_REPORT_DOUGHNUT,
  GET_DMARC_REPORT_DETAILED_TABLES,
} from './graphql/queries'
import SummaryCard from './SummaryCard'
import DmarcTimeGraph from './DmarcTimeGraph'
import { Box, Stack } from '@chakra-ui/core'
import DmarcReportTable from './DmarcReportTable'

export function DmarcReportPage() {
  const { currentUser } = useUserState()

  const {
    loading: doughnutLoading,
    error: doughnutError,
    data: doughnutData,
  } = useQuery(GET_DMARC_REPORT_DOUGHNUT, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: { domainSlug: 'cyber.gc.ca', period: 'LAST30DAYS', year: 2020 },
  })

  const { loading: barLoading, error: barError, data: barData } = useQuery(
    GET_DMARC_REPORT_BAR_GRAPH,
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
  } = useQuery(GET_DMARC_REPORT_DETAILED_TABLES, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: { domain: 'cyber.gc.ca' },
  })

  if (tableLoading || doughnutLoading || barLoading) return <p>Loading...</p>
  // TODO: Properly handle these errors
  if (tableError || doughnutError || barError) return <p>Error</p>

  console.log(tableData)

  const strengths = {
    strong: {
      types: ['dmarcFailReject', 'spfPassDkimPass'],
      name: 'Pass',
    },
    moderate: {
      types: ['dmarcFailQuarantine', 'spfFailDkimPass', 'spfPassDkimFail'],
      name: 'Partial Pass',
    },
    weak: {
      types: ['dmarcFailNone'],
      name: 'Fail',
    },
  }

  // TODO: reportCardData.strengths and formattedBarData.strengths reference
  //  the same object, is this okay?
  const reportCardData = doughnutData.getDmarcReportDoughnut
  reportCardData.strengths = strengths

  const formattedBarData = {
    periods: barData.getDmarcReportBarGraph.map((entry) => {
      return { month: entry.month, year: entry.year, ...entry.categoryTotals }
    }),
  }
  formattedBarData.strengths = strengths

  const detailTablesData = tableData.getDmarcReportDetailedTables.detailTables
  const fullPassData = detailTablesData.fullPass
  const spfFailureData = detailTablesData.spfFailure
  const spfMisalignedData = detailTablesData.spfMisaligned
  const dkimFailureData = detailTablesData.dkimFailure
  const dkimMisalignedData = detailTablesData.dkimMisaligned
  const dmarcFailureData = detailTablesData.dmarcFailure

  const [
    sourceIp,
    dnsDomain,
    envelopeFrom,
    dkimDomains,
    dkimSelectors,
    totalMessages,
  ] = [
    { Header: 'sourceIpAddress', accessor: 'sourceIpAddress' },
    { Header: 'dnsDomain', accessor: 'dnsDomain' },
    { Header: 'envelopeFrom', accessor: 'envelopeFrom' },
    { Header: 'dkimDomains', accessor: 'dkimDomains' },
    { Header: 'dkimSelectors', accessor: 'dkimSelectors' },
    { Header: 'totalMessages', accessor: 'totalMessages' },
  ]

  const fullPassColumns = [
    {
      Header: 'Fully Aligned by IP Address',
      columns: [
        sourceIp,
        dnsDomain,
        envelopeFrom,
        dkimDomains,
        dkimSelectors,
        totalMessages,
      ],
    },
  ]

  const spfFailureColumns = [
    {
      Header: 'SPF Failures by IP Address',
      columns: [sourceIp, dnsDomain, envelopeFrom, totalMessages],
    },
  ]

  const spfMisalignedColumns = [
    {
      Header: 'SPF Misalignment by IP Address',
      columns: [sourceIp, dnsDomain, envelopeFrom, totalMessages],
    },
  ]

  const dkimFailureColumns = [
    {
      Header: 'DKIM Failures by IP Address',
      columns: [
        sourceIp,
        dnsDomain,
        envelopeFrom,
        dkimDomains,
        dkimSelectors,
        totalMessages,
      ],
    },
  ]

  const dkimMisalignedColumns = [
    {
      Header: 'DKIM Misalignment by IP Address',
      columns: [
        sourceIp,
        dnsDomain,
        envelopeFrom,
        dkimDomains,
        dkimSelectors,
        totalMessages,
      ],
    },
  ]

  const dmarcFailureColumns = [
    {
      Header: 'DMARC Failures by IP Address',
      columns: [
        sourceIp,
        dnsDomain,
        envelopeFrom,
        dkimDomains,
        dkimSelectors,
        totalMessages,
      ],
    },
  ]

  // TODO: This should check full screen size, not window.innerWidth
  //  similar to:   @media screen and (max-width: 760px)
  const cardWidth =
    window.innerWidth < 500
      ? '100%'
      : window.innerWidth < 800
      ? '50%'
      : window.innerWidth < 1200
      ? '35%'
      : '20%'
  const timeGraphWidth =
    window.innerWidth < 500 ? '100%' : window.innerWidth < 1200 ? '75%' : '50%'

  const cardAndGraphFitInline =
    +cardWidth.slice(0, -1) + +timeGraphWidth.slice(0, -1) <= 100

  return (
    <Box width="100%">
      <Box>
        <Stack isInline={cardAndGraphFitInline} align="center">
          <SummaryCard
            title="DMARC Report"
            description="Description of DMARC report"
            data={reportCardData}
            slider={false}
            width={cardWidth}
            mx="auto"
          />
          <DmarcTimeGraph
            data={formattedBarData}
            width={timeGraphWidth}
            mx="auto"
          />
        </Stack>
        <DmarcReportTable data={fullPassData} columns={fullPassColumns} mb="30px" />
        <DmarcReportTable
          data={spfFailureData}
          columns={spfFailureColumns}
          mb="30px"
        />
        <DmarcReportTable
          data={spfMisalignedData}
          columns={spfMisalignedColumns}
          mb="30px"
        />
        <DmarcReportTable
          data={dkimFailureData}
          columns={dkimFailureColumns}
          mb="30px"
        />
        <DmarcReportTable
          data={dkimMisalignedData}
          columns={dkimMisalignedColumns}
          mb="30px"
        />
        <DmarcReportTable
          data={dmarcFailureData}
          columns={dmarcFailureColumns}
          mb="30px"
        />
      </Box>
    </Box>
  )
}
