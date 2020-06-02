import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/react-hooks'
import { GET_ALIGNED_BY_IP, GET_YEARLY_REPORT } from './graphql/queries'
import { slugify } from './slugify'
import { SummaryCard } from './SummaryCard'
import { DmarcTimeGraph } from './DmarcTimeGraph'
import { Box, Stack } from '@chakra-ui/core'
import { DmarcReportTable } from './DmarcReportTable'

export function DmarcReportPage() {
  const { currentUser } = useUserState()
  const [show, setShow] = React.useState(true)

  const { loading, error, data } = useQuery(GET_YEARLY_REPORT, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: { domain: 'cyber.gc.ca' },
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

  if (loading) return <p>Loading...</p>
  if (error) return <p>{String(error)}</p>

  if (alignIpLoading) return <p>Loading...</p>
  if (alignIpError) return <p>{String(error)}</p>

  const categoryTotals = data.getYearlyReport[0].category_totals

  const strong = (({ spf_pass_dkim_pass }) => ({
    spf_pass_dkim_pass,
  }))(categoryTotals)

  const moderate = (({ spf_fail_dkim_pass, spf_pass_dkim_fail }) => ({
    spf_fail_dkim_pass,
    spf_pass_dkim_fail,
  }))(categoryTotals)

  const weak = (({
    dmarc_fail_reject,
    dmarc_fail_none,
    dmarc_fail_quarantine,
  }) => ({
    dmarc_fail_reject,
    dmarc_fail_none,
    dmarc_fail_quarantine,
  }))(categoryTotals)

  const unknown = (({ unknown }) => ({
    unknown,
  }))(categoryTotals)

  const getNameQtyPair = (categoryPair) => {
    return Object.keys(categoryPair).map((key) => {
      return { name: key, qty: categoryPair[key] }
    })
  }

  const cardData = [
    {
      strength: 'strong',
      name: 'Pass',
      categories: getNameQtyPair(strong),
    },
    {
      strength: 'moderate',
      name: 'Partial pass',
      categories: getNameQtyPair(moderate),
    },
    {
      strength: 'weak',
      name: 'All fail',
      categories: getNameQtyPair(weak),
    },
    {
      strength: 'unknown',
      name: 'Unknown',
      categories: getNameQtyPair(unknown),
    },
  ]

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
  ]

  const spfFailColumns = [
    sourceIp,
    dnsDomain,
    envelopeFrom,
    headerFrom,
    spfResults,
    messageCount,
  ]

  const spfMisalignColumns = [
    sourceIp,
    dnsDomain,
    envelopeFrom,
    headerFrom,
    spfResults,
    spfAligned,
    messageCount,
  ]

  const dkimFailColumns = [
    sourceIp,
    dnsDomain,
    envelopeFrom,
    headerFrom,
    dkimDomains,
    dkimSelectors,
    dkimResults,
    messageCount,
  ]

  const dkimMisalignColumns = [
    sourceIp,
    dnsDomain,
    envelopeFrom,
    headerFrom,
    dkimDomains,
    dkimSelectors,
    dkimResults,
    dkimAligned,
    messageCount,
  ]

  const dmarcFailColumns = [
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
  ]

  const cloneData = [...data.getYearlyReport]

  const barData = cloneData.map((entry) => {
    return { month: entry.month, ...entry.category_totals }
  })

  return (
    <DmarcReportTable
      data={alignIpData.getAlignedByIp}
      columns={alignIpColumns}
    />
    // <DmarcTimeGraph data={barData} />
    // <Stack isInline>
    //   <SummaryCard
    //     title="DMARC Report"
    //     description="Description of DMARC report"
    //     data={cardData}
    //     slider={false}
    //   />
    //   <Box w="20px"></Box>
    //
    // </Stack>
  )
}
