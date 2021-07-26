import React, { useMemo, useState } from 'react'
import { PAGINATED_DMARC_REPORT_SUMMARY_TABLE as FORWARD } from './graphql/queries'
import {
  Box,
  Divider,
  Flex,
  Heading,
  Link,
  Select,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react'
import { LinkIcon } from '@chakra-ui/icons'
import TrackerTable from './TrackerTable'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { months } from './months'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { usePaginatedCollection } from './usePaginatedCollection'
import { Link as RouteLink } from 'react-router-dom'
import { InfoButton, InfoBox, InfoPanel } from './InfoPanel'

export default function DmarcByDomainPage() {
  const { i18n } = useLingui()
  const currentDate = new Date()
  const [selectedPeriod, setSelectedPeriod] = useState('LAST30DAYS')
  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear().toString(),
  )
  const [selectedDate, setSelectedDate] = useState(
    `LAST30DAYS, ${currentDate.getFullYear()}`,
  )
  const orderBy = {
    field: 'TOTAL_MESSAGES',
    direction: 'DESC',
  }

  const [infoState, changeInfoState] = useState({
    isVisible: false,
  })

  const { loading, error, nodes, resetToFirstPage } = usePaginatedCollection({
    fetchForward: FORWARD,
    recordsPerPage: 10,
    variables: {
      month: selectedPeriod,
      year: selectedYear,
      orderBy: orderBy,
    },
    relayRoot: 'findMyDmarcSummaries',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  })

  const formattedData = useMemo(() => {
    const curData = []
    nodes.forEach((node) => {
      const domain = node.domain.domain
      const percentages = { ...node.categoryPercentages }
      Object.entries(percentages).forEach(([key, value]) => {
        if (typeof value === 'number') percentages[key] = Math.round(value)
      })
      curData.push({ domain, ...percentages })
    })
    return curData
  }, [nodes])

  const [
    domain,
    totalMessages,
    fullPassPercentage,
    passSpfOnlyPercentage,
    passDkimOnlyPercentage,
    failPercentage,
  ] = [
    {
      Header: i18n._(t`Domain`),
      accessor: 'domain',
      // eslint-disable-next-line react/prop-types
      Cell: function CellValueWithLink({ value }) {
        return (
          <Link
            as={RouteLink}
            to={`domains/${value}/dmarc-report/LAST30DAYS/${new Date().getFullYear()}`}
            isExternal={false}
          >
            {`${value} `} <LinkIcon />
          </Link>
        )
      },
      style: { textAlign: 'left' },
      sortDescFirst: true,
    },
    {
      Header: i18n._(t`Total Messages`),
      accessor: 'totalMessages',
      Cell: ({ value }) => value.toLocaleString(i18n.locale),
      style: { textAlign: 'right' },
      sortDescFirst: true,
    },
    {
      Header: i18n._(t`Full Pass %`),
      accessor: 'fullPassPercentage',
      Cell: ({ value }) => `${value}%`,
      style: { textAlign: 'right' },
      sortDescFirst: true,
    },
    {
      Header: i18n._(t`Fail DKIM %`),
      accessor: 'passSpfOnlyPercentage',
      Cell: ({ value }) => `${value}%`,
      style: { textAlign: 'right' },
      sortDescFirst: true,
    },
    {
      Header: i18n._(t`Fail SPF %`),
      accessor: 'passDkimOnlyPercentage',
      Cell: ({ value }) => `${value}%`,
      style: { textAlign: 'right' },
      sortDescFirst: true,
    },
    {
      Header: i18n._(t`Full Fail %`),
      accessor: 'failPercentage',
      Cell: ({ value }) => `${value}%`,
      style: { textAlign: 'right' },
      sortDescFirst: true,
    },
  ]

  const percentageColumns = useMemo(
    () => [
      {
        Header: i18n._(t`DMARC Summaries`),
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
    ],
    [
      domain,
      totalMessages,
      fullPassPercentage,
      passSpfOnlyPercentage,
      passDkimOnlyPercentage,
      failPercentage,
      i18n,
    ],
  )

  // DMARC Summary Table setup
  let tableDisplay

  // Initial sorting category for detail tables
  const initialSort = [{ id: 'totalMessages', desc: true }]

  // Display error if exists
  if (error) {
    tableDisplay = <ErrorFallbackMessage error={error} />
  } else
    tableDisplay = (
      <TrackerTable
        data={formattedData}
        columns={percentageColumns}
        title="dmarcSummaries"
        initialSort={initialSort}
        mb="10px"
        searchPlaceholder={t`Search for a domain`}
      />
    )

  const handleChange = (e) => {
    setSelectedDate(e.target.value)
    const [newPeriod, newYear] = e.target.value.split(', ')
    setSelectedPeriod(newPeriod)
    setSelectedYear(newYear)
    resetToFirstPage()
  }

  const options = [
    <option
      key="LAST30DAYS"
      value={`LAST30DAYS, ${currentDate.getFullYear().toString()}`}
    >
      {t`Last 30 Days`}
    </option>,
  ]

  // add dmarc date selection options
  for (let i = currentDate.getMonth(), j = 13; j > 0; i--, j--) {
    // handle previous year
    if (i < 0) {
      const value = `${months[months.length + i].toUpperCase()}, ${
        currentDate.getFullYear() - 1
      }`
      const translatedValue = `${months[months.length + i].toUpperCase()}, ${
        currentDate.getFullYear() - 1
      }`

      options.push(
        <option key={value} value={value}>
          {translatedValue}
        </option>,
      )
    }
    // handle current year
    else {
      const value = `${months[i].toUpperCase()}, ${currentDate.getFullYear()}`
      const translatedValue = `${months[
        i
      ].toUpperCase()}, ${currentDate.getFullYear()}`

      options.push(
        <option key={value} value={value}>
          {translatedValue}
        </option>,
      )
    }
  }

  return (
    <Box width="100%" px="2">
      <Flex mb="4">
        <Heading as="h1" textAlign="left">
          <Trans>DMARC Summaries</Trans>
        </Heading>

        <InfoButton
          ml="auto"
          label="Glossary"
          state={infoState}
          changeState={changeInfoState}
        />
      </Flex>

      <InfoPanel state={infoState}>
        <InfoBox title="Domain" info="The domain address." />
        <InfoBox
          title="Total Messages"
          info="Shows the total number of emails that have been sent by this domain during the selected time range."
        />
        <InfoBox
          title="Full Pass %"
          info="Shows the percentage of emails from the domain that have passed both SPF and DKIM requirments."
        />
        <InfoBox
          title="Fail SPF %"
          info="Shows the percentage of emails from the domain that fail SPF requirments, but pass DKIM requirments."
        />
        <InfoBox
          title="Fail DKIM %"
          info="Shows the percentage of emails from the domain that fail DKIM requirments, but pass SPF requirments."
        />
        <InfoBox
          title="Full Fail %"
          info="Shows the percentage of emails from the domain that fail both SPF and DKIM requirments."
        />
        <Divider borderColor="gray.500" />
        <Trans>
          A more detailed breakdown of each domain can be found by clicking on
          its address in the first column.
        </Trans>
      </InfoPanel>

      <Flex align="center" mb="4px">
        <Text fontWeight="bold" textAlign="center">
          <Trans>Showing data for period: </Trans>
        </Text>
        <Select
          width="fit-content"
          onChange={(e) => handleChange(e)}
          value={selectedDate}
        >
          {options}
        </Select>
        {loading && (
          <Stack
            isInline
            justifyContent="center"
            w={{ base: '100%', md: '50%' }}
          >
            <Text fontWeight="bold" ml={{ md: 'auto' }} mr="1.5em">
              <Trans>Loading Data...</Trans>
            </Text>
            <Spinner
              size="md"
              speed="0.6s"
              color="primary"
              emptyColor="accent"
              thickness="0.175em"
            />
          </Stack>
        )}
      </Flex>

      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        {tableDisplay}
      </ErrorBoundary>
    </Box>
  )
}

DmarcByDomainPage.propTypes = {}
