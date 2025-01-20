import React, { useCallback, useMemo, useState } from 'react'
import { PAGINATED_DMARC_REPORT_SUMMARY_TABLE as FORWARD } from '../graphql/queries'
import {
  Box,
  Divider,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Spinner,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { LinkIcon, SearchIcon } from '@chakra-ui/icons'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { ErrorBoundary } from 'react-error-boundary'
import { Link as RouteLink } from 'react-router-dom'
import withSuperAdmin from '../app/withSuperAdmin'

import { TrackerTable } from '../components/TrackerTable'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { InfoButton, InfoBox, InfoPanel } from '../components/InfoPanel'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { toConstantCase } from '../helpers/toConstantCase'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { MonthSelect } from '../components/MonthSelect'
import { AffiliationFilterSwitch } from '../components/AffiliationFilterSwitch'
import { ExportRuaListButton } from './ExportRuaListButton'
import { useUserVar } from '../utilities/userState'
import { TourComponent } from '../userOnboarding/components/TourComponent'

export default function DmarcByDomainPage() {
  const { i18n } = useLingui()
  const currentDate = new Date()
  const { isLoggedIn, hasAffiliation } = useUserVar()

  const [selectedTableDisplayLimit, setSelectedTableDisplayLimit] = useState(50)
  const displayLimitOptions = [5, 10, 20, 50, 100]
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [isAffiliated, setIsAffiliated] = useState(hasAffiliation())

  const [selectedPeriod, setSelectedPeriod] = useState('LAST30DAYS')
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString())
  const [selectedDate, setSelectedDate] = useState(`LAST30DAYS, ${currentDate.getFullYear()}`)
  const [orderBy, setOrderBy] = useState({
    field: 'TOTAL_MESSAGES',
    direction: 'DESC',
  })
  const { isOpen, onToggle } = useDisclosure()

  const { loading, error, nodes, resetToFirstPage, hasNextPage, hasPreviousPage, next, previous, isLoadingMore } =
    usePaginatedCollection({
      fetchForward: FORWARD,
      recordsPerPage: selectedTableDisplayLimit,
      variables: {
        month: selectedPeriod,
        year: selectedYear,
        search: debouncedSearchTerm,
        orderBy: orderBy,
        isAffiliated,
      },
      relayRoot: 'findMyDmarcSummaries',
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    })

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

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

  const [domain, totalMessages, fullPassPercentage, passSpfOnlyPercentage, passDkimOnlyPercentage, failPercentage] = [
    {
      Header: i18n._(t`Domain`),
      accessor: 'domain',
      // eslint-disable-next-line react/prop-types
      Cell: function CellValueWithLink({ value }) {
        return (
          <Link
            as={RouteLink}
            to={`/domains/${value}/dmarc-report/LAST30DAYS/${new Date().getFullYear()}`}
            isExternal={false}
          >
            {`${value} `} <LinkIcon aria-hidden="true" />
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
    [domain, totalMessages, fullPassPercentage, passSpfOnlyPercentage, passDkimOnlyPercentage, failPercentage, i18n],
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

  const RuaDomainsExportButton = withSuperAdmin(() => {
    return <ExportRuaListButton ml="auto" />
  })

  return (
    <Box width="100%" px="2">
      <TourComponent />
      <Heading as="h1" textAlign="left" mb="4">
        <Trans>DMARC Summaries</Trans>
      </Heading>
      <Flex align="center" mb={2} className="month-select">
        <Text as="label" htmlFor="data-date-range" fontWeight="bold" textAlign="center" mr={1}>
          <Trans>Showing data for period: </Trans>
        </Text>
        <MonthSelect
          id="data-date-range"
          width="fit-content"
          handleChange={handleChange}
          selectedValue={selectedDate}
        />

        {loading && (
          <Stack isInline justifyContent="center" w={{ base: '100%', md: '50%' }}>
            <Text fontWeight="bold" ml={{ md: 'auto' }} mr="1.5em">
              <Trans>Loading Data...</Trans>
            </Text>
            <Spinner size="md" speed="0.6s" color="primary" emptyColor="accent" thickness="0.175em" />
          </Stack>
        )}
      </Flex>
      <Flex>
        <InputGroup w={{ base: '100%', md: '50%' }} mb={{ base: '8px', md: '0' }} className="search-bar">
          <InputLeftElement>
            <SearchIcon />
          </InputLeftElement>
          <Input
            borderColor="black"
            type="text"
            placeholder={t`Search for a domain`}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              resetToFirstPage()
            }}
          />
        </InputGroup>

        <InfoButton onToggle={onToggle} ml="100%" borderColor="black" borderWidth="1px" className="info-button" />
        <RuaDomainsExportButton />
      </Flex>
      {isLoggedIn() && (
        <Flex align="center" mb="2" className="filter-switch">
          <Text mr="2" fontWeight="bold" fontSize="lg">
            <Trans>Filters:</Trans>
          </Text>
          <AffiliationFilterSwitch
            isAffiliated={isAffiliated}
            setIsAffiliated={setIsAffiliated}
            resetToFirstPage={resetToFirstPage}
          />
        </Flex>
      )}
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        {tableDisplay}
        <RelayPaginationControls
          mt="0.5rem"
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
        <InfoPanel isOpen={isOpen} onToggle={onToggle}>
          <InfoBox title={t`Domain`} info={t`The domain address.`} />
          <InfoBox
            title={t`Total Messages`}
            info={t`Shows the total number of emails that have been sent by this domain during the selected time range.`}
          />
          <InfoBox
            title={t`Full Pass %`}
            info={t`Shows the percentage of emails from the domain that have passed both SPF and DKIM requirements.`}
          />
          <InfoBox
            title={t`Fail SPF %`}
            info={t`Shows the percentage of emails from the domain that fail SPF requirements, but pass DKIM requirements.`}
          />
          <InfoBox
            title={t`Fail DKIM %`}
            info={t`Shows the percentage of emails from the domain that fail DKIM requirements, but pass SPF requirements.`}
          />
          <InfoBox
            title={t`Full Fail %`}
            info={t`Shows the percentage of emails from the domain that fail both SPF and DKIM requirements.`}
          />
          <Divider borderColor="gray.500" />
          <Trans>
            A more detailed breakdown of each domain can be found by clicking on its address in the first column.
          </Trans>
        </InfoPanel>
      </ErrorBoundary>
    </Box>
  )
}

DmarcByDomainPage.propTypes = {}
