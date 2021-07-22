import React, { useState } from 'react'
import { Trans } from '@lingui/macro'
import { Box, Divider, Text } from '@chakra-ui/react'
import { PAGINATED_ORG_DOMAINS as FORWARD } from './graphql/queries'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { DomainCard } from './DomainCard'
import { ListOf } from './ListOf'
import { usePaginatedCollection } from './usePaginatedCollection'
import { number, string } from 'prop-types'
import { RelayPaginationControls } from './RelayPaginationControls'
import { InfoButton, InfoBox, InfoPanel } from './InfoPanel'

export function OrganizationDomains({ domainsPerPage = 10, orgSlug }) {
  const {
    loading,
    isLoadingMore,
    error,
    nodes,
    next,
    previous,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    variables: { slug: orgSlug },
    recordsPerPage: domainsPerPage,
    relayRoot: 'findOrganizationBySlug.domains',
  })

  const [infoState, changeInfoState] = useState({
    isVisible: false,
  })

  if (error) return <ErrorFallbackMessage error={error} />

  if (loading)
    return (
      <LoadingMessage>
        <Trans>Domains</Trans>
      </LoadingMessage>
    )

  return (
    <Box>
      <InfoButton
        w="100%"
        label="Glossary"
        state={infoState}
        changeState={changeInfoState}
      />

      <InfoPanel state={infoState}>
        <InfoBox title="Domain" info="The domain address." />
        <InfoBox
          title="Last scanned"
          info="The time the domain was last scanned by the system."
        />
        <InfoBox
          title="HTTPS"
          info="Shows if the domain meets the Hypertext Transfer Protocol Secure (HTTPS) requirments."
        />
        <InfoBox
          title="SSL"
          info="Shows if the domain meets the Secure Sockets Layer (SSL) requirements."
        />
        <InfoBox
          title="SPF"
          info="Shows if the domain meets the Sender Policy Framework (SPF) requiremtns."
        />
        <InfoBox
          title="DKIM"
          info="Shows if the domain meets the DomainKeys Identified Mail (DKIM) requirements."
        />
        <InfoBox
          title="DMARC"
          info="Shows if the domain meets the Message Authentication, Reporting, and Conformance (DMARC) requirements."
        />
      </InfoPanel>

      <ListOf
        elements={nodes}
        ifEmpty={() => (
          <Text fontSize="xl" fontWeight="bold">
            <Trans>No Domains</Trans>
          </Text>
        )}
        mb="4"
      >
        {({ id, domain, lastRan, status, hasDMARCReport }, index) => (
          <ErrorBoundary
            key={`${id}:${index}`}
            FallbackComponent={ErrorFallbackMessage}
          >
            <Box>
              <DomainCard
                url={domain}
                lastRan={lastRan}
                status={status}
                hasDMARCReport={hasDMARCReport}
              />
              <Divider borderColor="gray.900" />
            </Box>
          </ErrorBoundary>
        )}
      </ListOf>
      <RelayPaginationControls
        onlyPagination={true}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
      />
    </Box>
  )
}

OrganizationDomains.propTypes = { domainsPerPage: number, orgSlug: string }
