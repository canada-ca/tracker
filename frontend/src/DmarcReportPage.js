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
  GET_YEARLY_DMARC_REPORT_SUMMARIES,
} from './graphql/queries'
import SummaryCard from './SummaryCard'
import DmarcTimeGraph from './DmarcTimeGraph'
import { Box, Stack } from '@chakra-ui/core'
import DmarcReportTable from './DmarcReportTable'

export function DmarcReportPage() {
  const { currentUser } = useUserState()
  const [show, setShow] = React.useState(true)

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

  const {
    loading: yearlyLoading,
    error: yearlyError,
    data: barData,
  } = useQuery(GET_DMARC_REPORT_BAR_GRAPH, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: { domainSlug: 'cyber.gc.ca' },
  })

  const {
    loading: alignIpLoading,
    error: alignIpError,
    data: alignIpData,
  } = useQuery(GET_ALIGNED_BY_IP, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: { domain: 'cyber.gc.ca' },
  })

  const {
    loading: spfFailLoading,
    error: spfFailError,
    data: spfFailData,
  } = useQuery(GET_SPF_FAILURES, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: { domain: 'cyber.gc.ca' },
  })

  const {
    loading: spfMisalignLoading,
    error: spfMisalignError,
    data: spfMisalignData,
  } = useQuery(GET_SPF_MISALIGN, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: { domain: 'cyber.gc.ca' },
  })

  const {
    loading: dkimFailLoading,
    error: dkimFailError,
    data: dkimFailData,
  } = useQuery(GET_DKIM_FAILURES, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: { domain: 'cyber.gc.ca' },
  })

  const {
    loading: dkimMisalignLoading,
    error: dkimMisalignError,
    data: dkimMisalignData,
  } = useQuery(GET_DKIM_MISALIGN, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: { domain: 'cyber.gc.ca' },
  })

  const {
    loading: dmarcFailLoading,
    error: dmarcFailError,
    data: dmarcFailData,
  } = useQuery(GET_DMARC_FAILURES, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: { domain: 'cyber.gc.ca' },
  })

  if (
    alignIpLoading ||
    spfFailLoading ||
    spfMisalignLoading ||
    dkimFailLoading ||
    dkimMisalignLoading ||
    dmarcFailLoading ||
    doughnutLoading ||
    yearlyLoading
  )
    return <p>Loading...</p>
  if (
    alignIpError ||
    spfFailError ||
    spfFailError ||
    spfMisalignError ||
    dkimFailError ||
    dkimMisalignError ||
    dmarcFailError ||
    doughnutError ||
    yearlyError
  )
    return <p>Error</p>

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

  const [
    sourceIp,
    dnsDomain,
    headerFrom,
    envelopeFrom,
    spfResults,
    spfAligned,
    dkimDomains,
    dkimSelectors,
    dkimResults,
    dkimAligned,
    messageCount,
    disposition,
  ] = [
    { Header: 'source_ip_address', accessor: 'source_ip_address' },
    { Header: 'dns_domain', accessor: 'dns_domain' },
    { Header: 'header_from', accessor: 'header_from' },
    { Header: 'envelope_from', accessor: 'envelope_from' },
    { Header: 'spf_results', accessor: 'spf_results' },
    { Header: 'spf_aligned', accessor: 'spf_aligned' },
    { Header: 'dkim_domains', accessor: 'dkim_domains' },
    { Header: 'dkim_selectors', accessor: 'dkim_selectors' },
    { Header: 'dkim_results', accessor: 'dkim_results' },
    { Header: 'dkim_aligned', accessor: 'dkim_aligned' },
    { Header: 'message_count', accessor: 'message_count' },
    { Header: 'disposition', accessor: 'disposition' },
  ]

  const alignIpColumns = [
    {
      Header: 'Fully Aligned by IP Address',
      columns: [
        sourceIp,
        dnsDomain,
        headerFrom,
        envelopeFrom,
        spfResults,
        spfAligned,
        dkimDomains,
        dkimSelectors,
        dkimResults,
        dkimAligned,
        messageCount,
      ],
    },
  ]

  const spfFailColumns = [
    {
      Header: 'SPF Failures by IP Address',
      columns: [
        sourceIp,
        dnsDomain,
        envelopeFrom,
        headerFrom,
        spfResults,
        messageCount,
      ],
    },
  ]

  const spfMisalignColumns = [
    {
      Header: 'SPF Misalignment by IP Address',
      columns: [
        sourceIp,
        dnsDomain,
        envelopeFrom,
        headerFrom,
        spfResults,
        spfAligned,
        messageCount,
      ],
    },
  ]

  const dkimFailColumns = [
    {
      Header: 'DKIM Failures by IP Address',
      columns: [
        sourceIp,
        dnsDomain,
        envelopeFrom,
        headerFrom,
        dkimDomains,
        dkimSelectors,
        dkimResults,
        messageCount,
      ],
    },
  ]

  const dkimMisalignColumns = [
    {
      Header: 'DKIM Misalignment by IP Address',
      columns: [
        sourceIp,
        dnsDomain,
        envelopeFrom,
        headerFrom,
        dkimDomains,
        dkimSelectors,
        dkimResults,
        dkimAligned,
        messageCount,
      ],
    },
  ]

  const dmarcFailColumns = [
    {
      Header: 'DMARC Failures by IP Address',
      columns: [
        sourceIp,
        dnsDomain,
        envelopeFrom,
        headerFrom,
        spfResults,
        spfAligned,
        dkimDomains,
        dkimSelectors,
        dkimResults,
        dkimAligned,
        disposition,
        messageCount,
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
        <DmarcReportTable
          data={alignIpData.getAlignedByIp}
          columns={alignIpColumns}
          mb="30px"
        />
        <DmarcReportTable
          data={spfFailData.getSpfFailures}
          columns={spfFailColumns}
          mb="30px"
        />
        <DmarcReportTable
          data={spfMisalignData.getSpfMisalign}
          columns={spfMisalignColumns}
          mb="30px"
        />
        <DmarcReportTable
          data={dkimFailData.getDkimFailures}
          columns={dkimFailColumns}
          mb="30px"
        />
        <DmarcReportTable
          data={dkimMisalignData.getDkimMisalign}
          columns={dkimMisalignColumns}
          mb="30px"
        />
        <DmarcReportTable
          data={dmarcFailData.getDmarcFailures}
          columns={dmarcFailColumns}
          mb="30px"
        />
      </Box>
    </Box>
  )
}
