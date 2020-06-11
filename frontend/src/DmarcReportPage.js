import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/react-hooks'
import {
  GET_DMARC_REPORT_BAR_GRAPH,
  GET_DMARC_REPORT_DOUGHNUT,
  GET_DMARC_REPORT_DETAILED_TABLES,
} from './graphql/queries'
import SummaryCard from './SummaryCard'
import DmarcTimeGraph from './DmarcTimeGraph'
import { Box } from '@chakra-ui/core'
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

  const initialSort = [{ id: 'totalMessages', desc: true }]

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
      hidden: true,
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
      hidden: true,
      columns: [sourceIp, dnsDomain, envelopeFrom, totalMessages],
    },
  ]

  const spfMisalignedColumns = [
    {
      Header: 'SPF Misalignment by IP Address',
      hidden: true,
      columns: [sourceIp, dnsDomain, envelopeFrom, totalMessages],
    },
  ]

  const dkimFailureColumns = [
    {
      Header: 'DKIM Failures by IP Address',
      hidden: true,
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
      hidden: true,
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
      hidden: true,
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
  const cardWidth = window.matchMedia('(max-width: 500px)').matches
    ? '100%'
    : window.matchMedia('(max-width: 800px)').matches
    ? '50%'
    : window.matchMedia('(max-width: 1200px)').matches
    ? '35%'
    : '20%'

  return (
    <Box width="100%">
      <Box>
        <SummaryCard
          title="DMARC Report"
          description="Description of DMARC report"
          data={reportCardData}
          slider={false}
          width={cardWidth}
          mx="auto"
        />
        <DmarcTimeGraph data={formattedBarData} width="100%" mx="auto" />
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
    </Box>
  )
}
