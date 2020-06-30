import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/react-hooks'
import {
  DEMO_DMARC_REPORT_DETAIL_TABLES,
  DEMO_DMARC_REPORT_SUMMARY_LIST,
} from './graphql/queries'
import SummaryCard from './SummaryCard'
import DmarcTimeGraph from './DmarcReportSummaryGraph'
import { Box, Stack, Text } from '@chakra-ui/core'
import DmarcReportTable from './DmarcReportTable'
import { t, Trans } from '@lingui/macro'
import { number } from 'prop-types'
import { useLingui } from '@lingui/react'
import theme from './theme/canada'

const { colors } = theme

export default function DmarcReportPage({ summaryListResponsiveWidth }) {
  const { currentUser } = useUserState()
  const { i18n } = useLingui()

  const { loading: barLoading, error: barError, data: barData } = useQuery(
    DEMO_DMARC_REPORT_SUMMARY_LIST,
    {
      context: {
        headers: {
          authorization: currentUser.jwt,
        },
      },
      variables: { domainSlug: 'test-domain-slug' },
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
    variables: {
      domainSlug: 'test-domain-slug',
      period: 'LAST30DAYS',
      year: '2020',
    },
  })

  if (tableLoading || barLoading) return <p>Loading...</p>
  // TODO: Properly handle these errors
  if (tableError || barError) return <p>Error</p>

  // TODO: remove this after the new api function lands.
  const summaryData = {
    categories: [
      {
        name: 'fullPass',
        count: 33,
        percentage: 33,
      },
      {
        name: 'partialPass',
        count: 33,
        percentage: 33,
      },
      {
        name: 'fail',
        count: 33,
        percentage: 33,
      },
    ],
    total: 100,
  }

  const strengths = {
    strong: {
      types: ['fullPass'],
      name: i18n._(t`Pass`),
    },
    moderate: {
      types: ['partialPass'],
      name: i18n._(t`Partial Pass`),
    },
    weak: {
      types: ['fail'],
      name: i18n._(t`Fail`),
    },
  }

  const formattedBarData = {
    periods: barData.demoDmarcReportSummaryList.map((entry) => {
      return { month: entry.month, year: entry.year, ...entry.categoryTotals }
    }),
  }
  formattedBarData.strengths = { ...strengths }

  const detailTablesData = tableData.demoDmarcReportDetailTables.detailTables

  const fullPassData = detailTablesData.fullPass
  const spfFailureData = detailTablesData.spfFailure
  const spfMisalignedData = detailTablesData.spfMisaligned
  const dkimFailureData = detailTablesData.dkimFailure
  const dkimMisalignedData = detailTablesData.dkimMisaligned
  const dmarcFailureData = detailTablesData.dmarcFailure

  // Initial sorting category for detail tables
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
    { Header: i18n._(t`Source IP Address`), accessor: 'sourceIpAddress' },
    { Header: i18n._(t`Envelope From`), accessor: 'envelopeFrom' },
    { Header: i18n._(t`DKIM Domains`), accessor: 'dkimDomains' },
    { Header: i18n._(t`DKIM Selectors`), accessor: 'dkimSelectors' },
    { Header: i18n._(t`Total Messages`), accessor: 'totalMessages' },
    { Header: i18n._(t`Country Code`), accessor: 'countryCode' },
    { Header: i18n._(t`Prefix Org`), accessor: 'prefixOrg' },
    { Header: i18n._(t`DNS Host`), accessor: 'dnsHost' },
    { Header: i18n._(t`SPF Domains`), accessor: 'spfDomains' },
  ]

  const fullPassColumns = [
    {
      Header: i18n._(t`Fully Aligned by IP Address`),
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
      Header: i18n._(t`SPF Failures by IP Address`),
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
      Header: i18n._(t`SPF Misalignment by IP Address`),
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
      Header: i18n._(t`DKIM Failures by IP Address`),
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
      Header: i18n._(t`DKIM Misalignment by IP Address`),
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
      Header: i18n._(t`DMARC Failures by IP Address`),
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

  const graphWidth =
    cardWidth.slice(0, -1) <= 20
      ? `${100 - Number(cardWidth.slice(0, -1))}%`
      : '100%'

  const cardAndGraphInline = graphWidth !== '100%'

  return (
    <Box width="100%">
      <Text>
        <Trans>
          *All data represented is mocked for demonstration purposes
        </Trans>
      </Text>
      <Stack align="center" isInline={cardAndGraphInline}>
        <SummaryCard
          title={i18n._(t`DMARC Report`)}
          description={i18n._(t`Description of DMARC report`)}
          categoryDisplay={{
            fullPass: {
              name: i18n._(t`Pass`),
              color: colors.strong,
            },
            partialPass: {
              name: i18n._(t`Partial Pass`),
              color: colors.moderate,
            },
            fail: {
              name: i18n._(t`Fail`),
              color: colors.weak,
            },
          }}
          data={summaryData}
          width={cardWidth}
          mx="auto"
        />
        <DmarcTimeGraph
          data={formattedBarData}
          width={graphWidth}
          mx="auto"
          responsiveWidth={summaryListResponsiveWidth}
        />
      </Stack>
      <DmarcReportTable
        data={fullPassData}
        columns={fullPassColumns}
        title={i18n._(t`Fully Aligned by IP Address`)}
        initialSort={initialSort}
        mb="30px"
      />
      <DmarcReportTable
        data={spfFailureData}
        columns={spfFailureColumns}
        title={i18n._(t`SPF Failures by IP Address`)}
        initialSort={initialSort}
        mb="30px"
      />
      <DmarcReportTable
        data={spfMisalignedData}
        columns={spfMisalignedColumns}
        title={i18n._(t`SPF Misalignment by IP Address`)}
        initialSort={initialSort}
        mb="30px"
      />
      <DmarcReportTable
        data={dkimFailureData}
        columns={dkimFailureColumns}
        title={i18n._(t`DKIM Failures by IP Address`)}
        initialSort={initialSort}
        mb="30px"
      />
      <DmarcReportTable
        data={dkimMisalignedData}
        columns={dkimMisalignedColumns}
        title={i18n._(t`DKIM Misalignment by IP Address`)}
        initialSort={initialSort}
        mb="30px"
      />
      <DmarcReportTable
        data={dmarcFailureData}
        columns={dmarcFailureColumns}
        title={i18n._(t`DMARC Failures by IP Address`)}
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
