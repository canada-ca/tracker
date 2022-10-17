import React from "react"
import {Flex, Text} from "@chakra-ui/react"
import {WarningTwoIcon} from "@chakra-ui/icons"
import {Trans} from "@lingui/macro"

export function SubdomainWarning({...props}) {
  return (
    <Flex
      direction="row"
      border="1px solid black"
      rounded="lg"
      p="1rem"
      bg="primary"
      {...props}
    >
      <WarningTwoIcon mr="1rem" my="auto" color="yellow " />
      <Text color="white" fontWeight="bold">
        <Trans>
          Tracker HSTS and HTTPS results display incorrectly when a domain has a
          non-compliant WWW subdomain. Check your WWW subdomain if your results
          appear incorrect. For example, the results for www.canada.ca in the
          Tracker platform are included in the results for canada.ca Work is in
          progress to separate the results.
        </Trans>
      </Text>
    </Flex>
  )
}
