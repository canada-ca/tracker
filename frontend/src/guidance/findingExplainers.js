import React from 'react'
import { Box, Text } from '@chakra-ui/react'
import { Trans } from '@lingui/react/macro'

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

const asEntries = (value) => (isPlainObject(value) ? Object.entries(value) : [])

const stringifyValue = (value) => (typeof value === 'string' ? value : JSON.stringify(value))

const cnameExplainer = ({ subject, evidence, attributes }) => {
  const target = evidence.target
  const provider = attributes?.provider
  return (
    <Text>
      {provider ? (
        <Trans>
          {subject} is a CNAME pointing to {target}, which appears to belong to {provider}. If that resource is
          unclaimed, someone else could take over the subdomain.
        </Trans>
      ) : (
        <Trans>
          {subject} is a CNAME pointing to {target}. If that resource is unclaimed, someone else could take over the
          subdomain.
        </Trans>
      )}
    </Text>
  )
}

const nsExplainer = ({ subject, evidence, attributes }) => {
  const target = evidence.target
  const { lameType, provider } = attributes || {}
  return (
    <Text>
      {lameType && provider && (
        <Trans>
          Nameserver {target} for {subject} is {lameType} lame and appears to belong to {provider}. An attacker could
          take over the delegation.
        </Trans>
      )}
      {lameType && !provider && (
        <Trans>
          Nameserver {target} for {subject} is {lameType} lame. An attacker could take over the delegation.
        </Trans>
      )}
      {!lameType && provider && (
        <Trans>
          Nameserver {target} for {subject} is lame and appears to belong to {provider}. An attacker could take over the
          delegation.
        </Trans>
      )}
      {!lameType && !provider && (
        <Trans>
          Nameserver {target} for {subject} is lame. An attacker could take over the delegation.
        </Trans>
      )}
    </Text>
  )
}

const subdomainTakeoverExplainer = (finding) => {
  const recordType = finding.evidence?.recordType
  if (recordType === 'CNAME' && finding.evidence.target) return cnameExplainer(finding)
  if (recordType === 'NS' && finding.evidence.target) return nsExplainer(finding)
  return genericExplainer(finding)
}

/** Fallback explanation: names the source and lists every evidence and attributes entry. */
export const genericExplainer = ({ source, evidence, attributes }) => {
  const entries = [...asEntries(evidence), ...asEntries(attributes)]
  return (
    <Box>
      <Text>
        <Trans>Detected by {source}.</Trans>
      </Text>
      {entries.length > 0 && (
        <Box as="dl" fontSize="sm" mt="1">
          {entries.map(([key, value]) => (
            <Box key={key} display="flex" gap="2">
              <Text as="dt" fontFamily="mono" fontWeight="bold">
                {key}
              </Text>
              <Text as="dd" fontFamily="mono" wordBreak="break-all">
                {stringifyValue(value)}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

/** Explainers keyed by finding `source`. Each takes a finding and returns a React node. */
export const findingExplainers = {
  'subdomain-takeover': subdomainTakeoverExplainer,
}

export const explainFinding = (finding) => (findingExplainers[finding.source] || genericExplainer)(finding)

/** One-line remediation sentences keyed by `findingType`. Each takes a finding and returns a React node. */
export const findingRemediations = {
  'subdomain-takeover-cname': (finding) => {
    const subject = finding.subject
    const provider = finding.attributes?.provider
    return provider ? (
      <Trans>
        Remove the dangling CNAME record for {subject}, or reclaim the resource at {provider} it points to.
      </Trans>
    ) : (
      <Trans>Remove the dangling CNAME record for {subject}, or reclaim the resource it points to.</Trans>
    )
  },
  'subdomain-takeover-ns': (finding) => {
    const subject = finding.subject
    const provider = finding.attributes?.provider
    return provider ? (
      <Trans>
        Fix the nameserver delegation for {subject} by restoring authoritative DNS at {provider} or removing the NS
        records.
      </Trans>
    ) : (
      <Trans>
        Fix the nameserver delegation for {subject} by restoring authoritative DNS or removing the NS records.
      </Trans>
    )
  },
}

/** Returns the remediation node for a finding, or null when its type has none. */
export const remediateFinding = (finding) => findingRemediations[finding.findingType]?.(finding) ?? null
