import React from 'react'
import { t, Trans } from '@lingui/macro'
import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Select,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Divider,
  Input,
  Button,
  PopoverFooter,
  Link,
} from '@chakra-ui/react'
import { func, object, string } from 'prop-types'

export function CvdEnrollmentForm({ handleChange, values, permission, ...rest }) {
  return (
    <Box {...rest}>
      <FormControl mb="2">
        <FormLabel htmlFor="cvdEnrollment.status" fontWeight="bold">
          <Flex align="center">
            <Trans>CVD Enrollment Status</Trans>
            <Popover placement="right" isLazy borderColor="black">
              <PopoverTrigger>
                <Button variant="link" ml="auto" size="sm" color="info">
                  <Trans>More Info</Trans>
                </Button>
              </PopoverTrigger>
              <PopoverContent maxW="md">
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader fontWeight="bold">
                  <Trans>About Coordinated Vulnerability Disclosure (CVD)</Trans>
                </PopoverHeader>
                <PopoverBody fontWeight="normal">
                  <Text mb={2}>
                    <Trans>
                      <b>1. What is Coordinated Vulnerability Disclosure (CVD)?</b>
                      <br />A structured process that allows security researchers to report vulnerabilities safely and
                      responsibly. It ensures findings are received, validated, and addressed in an organized way,
                      helping organizations fix issues before they can be exploited.
                    </Trans>
                  </Text>
                  <Divider borderBottomColor="gray.300" />
                  <Text mb={2}>
                    <Trans>
                      <b>2. Why enroll your domains?</b>
                      <br />
                      Enrolling your internet‑facing assets ensures researchers can report real vulnerabilities directly
                      to the Government of Canada through an approved and safe channel. This improves early detection,
                      reduces security risk, and strengthens your organization’s ability to respond quickly and
                      consistently.
                    </Trans>
                  </Text>
                  <Divider borderBottomColor="gray.300" />
                  <Text mb={2}>
                    <Trans>
                      <b>3. Which domains should you enroll?</b>
                      <br />
                      Enroll any public, internet‑facing domains or subdomains your organization owns—especially
                      production systems that deliver services or expose application functionality. Test or pre‑launch
                      environments may be excluded unless they are publicly accessible.
                    </Trans>
                  </Text>
                </PopoverBody>
                <PopoverFooter>
                  <Button
                    variant="primary"
                    size="lg"
                    as={Link}
                    href={'mailto:zzTBSCybers@tbs-sct.gc.ca?subject=GC%CVD%Support'}
                    isExternal={true}
                  >
                    <Trans>Contact Us</Trans>
                  </Button>
                </PopoverFooter>
              </PopoverContent>
            </Popover>
          </Flex>
        </FormLabel>
        <Select
          name="cvdEnrollment.status"
          id="cvdEnrollment.status"
          borderColor="black"
          onChange={handleChange}
          value={values.cvdEnrollment.status}
        >
          <option value="NOT_ENROLLED">
            <Trans>Not Enrolled</Trans>
          </option>
          {(permission === 'ADMIN' || values.cvdEnrollment.status === 'PENDING') && (
            <option value="PENDING">
              <Trans>Pending</Trans>
            </option>
          )}
          {['OWNER', 'SUPER_ADMIN'].includes(permission) && (
            <option value="ENROLLED">
              <Trans>Enrolled</Trans>
            </option>
          )}
        </Select>
      </FormControl>

      {values.cvdEnrollment.status !== 'NOT_ENROLLED' && (
        <>
          <FormControl mb="2">
            <FormLabel htmlFor="cvdEnrollment.description" fontWeight="bold">
              <Flex align="center">
                <Trans>Description</Trans>
              </Flex>
            </FormLabel>
            <Input
              type="text"
              name="cvdEnrollment.description"
              id="cvdEnrollment.description"
              value={values.cvdEnrollment.description}
              onChange={handleChange}
              borderColor="black"
              borderRadius={4}
              padding={2}
              width="100%"
              placeholder={t`Add details about the enrollment (optional)`}
            />
          </FormControl>

          <FormControl mb="2">
            <FormLabel htmlFor="cvdEnrollment.maxSeverity" fontWeight="bold">
              <Flex align="center">
                <Trans>Max Severity</Trans>
              </Flex>
            </FormLabel>
            <Select
              name="cvdEnrollment.maxSeverity"
              id="cvdEnrollment.maxSeverity"
              borderColor="black"
              onChange={handleChange}
              value={values.cvdEnrollment.maxSeverity}
            >
              <option value="">
                <Trans>Select severity</Trans>
              </option>
              <option value="LOW">
                <Trans>Low</Trans>
              </option>
              <option value="MEDIUM">
                <Trans>Medium</Trans>
              </option>
              <option value="HIGH">
                <Trans>High</Trans>
              </option>
              <option value="CRITICAL">
                <Trans>Critical</Trans>
              </option>
            </Select>
          </FormControl>

          <FormControl mb="2">
            <FormLabel htmlFor="cvdEnrollment.confidentialityRequirement" fontWeight="bold">
              <Flex align="center">
                <Trans>Confidentiality Requirement</Trans>
              </Flex>
            </FormLabel>
            <Select
              name="cvdEnrollment.confidentialityRequirement"
              id="cvdEnrollment.confidentialityRequirement"
              borderColor="black"
              onChange={handleChange}
              value={values.cvdEnrollment.confidentialityRequirement || ''}
            >
              <option value="">
                <Trans>Select requirement</Trans>
              </option>
              <option value="NONE">
                <Trans>None</Trans>
              </option>
              <option value="LOW">
                <Trans>Low</Trans>
              </option>
              <option value="HIGH">
                <Trans>High</Trans>
              </option>
            </Select>
          </FormControl>

          <FormControl mb="2">
            <FormLabel htmlFor="cvdEnrollment.integrityRequirement" fontWeight="bold">
              <Flex align="center">
                <Trans>Integrity Requirement</Trans>
              </Flex>
            </FormLabel>
            <Select
              name="cvdEnrollment.integrityRequirement"
              id="cvdEnrollment.integrityRequirement"
              borderColor="black"
              onChange={handleChange}
              value={values.cvdEnrollment.integrityRequirement || ''}
            >
              <option value="">
                <Trans>Select requirement</Trans>
              </option>
              <option value="NONE">
                <Trans>None</Trans>
              </option>
              <option value="LOW">
                <Trans>Low</Trans>
              </option>
              <option value="HIGH">
                <Trans>High</Trans>
              </option>
            </Select>
          </FormControl>

          <FormControl mb="2">
            <FormLabel htmlFor="cvdEnrollment.availabilityRequirement" fontWeight="bold">
              <Flex align="center">
                <Trans>Availability Requirement</Trans>
              </Flex>
            </FormLabel>
            <Select
              name="cvdEnrollment.availabilityRequirement"
              id="cvdEnrollment.availabilityRequirement"
              borderColor="black"
              onChange={handleChange}
              value={values.cvdEnrollment.availabilityRequirement}
            >
              <option value="">
                <Trans>Select requirement</Trans>
              </option>
              <option value="NONE">
                <Trans>None</Trans>
              </option>
              <option value="LOW">
                <Trans>Low</Trans>
              </option>
              <option value="HIGH">
                <Trans>High</Trans>
              </option>
            </Select>
          </FormControl>
        </>
      )}
    </Box>
  )
}

CvdEnrollmentForm.propTypes = {
  values: object,
  permission: string,
  handleChange: func,
}
