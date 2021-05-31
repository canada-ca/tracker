import React, { useCallback, useMemo, useState } from 'react'
import { useUserState } from './UserState'
import { PAGINATED_DMARC_REPORT_SUMMARY_TABLE as FORWARD } from './graphql/queries'
import {
  Box,
  Flex,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/core'
import DmarcReportTable from './DmarcReportTable'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { months } from './months'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { usePaginatedCollection } from './usePaginatedCollection'
import { RelayPaginationControls } from './RelayPaginationControls'
import { toConstantCase } from './helpers/toConstantCase'
import { useDebounce } from './useDebounce'

export default function DmarcByDomainPage() {
  const { currentUser } = useUserState()
  const { i18n } = useLingui()
  const currentDate = new Date()
  const [selectedPeriod, setSelectedPeriod] = useState('LAST30DAYS')
  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear().toString(),
  )
  const [selectedDate, setSelectedDate] = useState(
    `LAST30DAYS, ${currentDate.getFullYear()}`,
  )
  const [selectedTableDisplayLimit, setSelectedTableDisplayLimit] = useState(10)
  const displayLimitOptions = [5, 10, 20, 50, 100]
  const [orderBy, setOrderBy] = useState({
    field: 'TOTAL_MESSAGES',
    direction: 'DESC',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [dbSearchTerm, setDbSearchTerm] = useState('')

  const {
    loading,
    isLoadingMore,
    error,
    nodes,
    next,
    previous,
    resetToFirstPage,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    fetchHeaders: { authorization: currentUser.jwt },
    recordsPerPage: selectedTableDisplayLimit,
    variables: {
      month: selectedPeriod,
      year: selectedYear,
      search: dbSearchTerm,
      orderBy: orderBy,
    },
    relayRoot: 'findMyDmarcSummaries',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  })

  const memoizedSearchTerm = useMemo(() => {
    return [searchTerm]
  }, [searchTerm])

  useDebounce(setDbSearchTerm, 500, memoizedSearchTerm)

  const updateOrderBy = useCallback(
    (sortBy) => {
      let newOrderBy = {
        field: 'TOTAL_MESSAGES',
        direction: 'DESC',
      }
      if (sortBy.length) {
        newOrderBy = {}
        newOrderBy.field = toConstantCase(sortBy[0].id)
        newOrderBy.direction = sortBy[0].desc === true ? 'DESC' : 'ASC'
      }
      resetToFirstPage()
      setOrderBy(newOrderBy)
    },
    [resetToFirstPage],
  )

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
    ],
    [
      domain,
      totalMessages,
      fullPassPercentage,
      passSpfOnlyPercentage,
      passDkimOnlyPercentage,
      failPercentage,
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
      <DmarcReportTable
        data={formattedData}
        columns={percentageColumns}
        title={i18n._(t`Pass/Fail Ratios by Domain`)}
        initialSort={initialSort}
        mb="10px"
        hideTitleButton={true}
        linkColumns={[{ column: 'domain', isExternal: false }]}
        prependLink="domains/"
        appendLink={`/dmarc-report/${selectedPeriod}/${selectedYear}`}
        frontendPagination={false}
        selectedDisplayLimit={selectedTableDisplayLimit}
        manualSort={true}
        manualFilters={true}
        onSort={updateOrderBy}
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
      <Heading as="h1" textAlign="center" size="lg" mb="4px">
        <Trans>DMARC Messages</Trans>
      </Heading>

      <Stack isInline align="center" mb="4px">
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
      </Stack>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        alignItems={{ base: 'stretch', md: 'center' }}
        mb={{ base: '8px', md: '8px' }}
      >
        <InputGroup
          w={{ base: '100%', md: '50%' }}
          mb={{ base: '8px', md: '0' }}
        >
          <InputLeftElement>
            <Icon name="search" color="gray.300" />
          </InputLeftElement>
          <Input
            type="text"
            placeholder={t`Search for a domain`}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              resetToFirstPage()
            }}
          />
        </InputGroup>
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
      <RelayPaginationControls
        onlyPagination={false}
        selectedDisplayLimit={selectedTableDisplayLimit}
        setSelectedDisplayLimit={setSelectedTableDisplayLimit}
        displayLimitOptions={displayLimitOptions}
        resetToFirstPage={resetToFirstPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
      />
    </Box>
  )
}

DmarcByDomainPage.propTypes = {}
