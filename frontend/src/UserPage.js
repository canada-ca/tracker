import React from 'react'

import { useFormik } from 'formik'

import { Stack, SimpleGrid, Button, Text, Select, Input } from '@chakra-ui/core'

export function UserPage() {
  const userDetailsFormik = useFormik({
    initialValues: {
      email: 'steve@email.gc.ca',
      lang: 'select option',
      displayName: 'steve',
    },
    onSubmit: values => {
      window.alert(JSON.stringify(values, null, 2))
    },
  })
  return (
    <SimpleGrid columns={{ md: 1, lg: 2 }} spacing="40px" width="100%">
      <form onSubmit={userDetailsFormik.handleSubmit}>
        <Stack p={10} spacing={6}>
          <Text fontSize="2xl" fontWeight="bold" textAlign="center">
            User Profile
          </Text>

          <Stack>
            <Text fontSize="xl">Display Name:</Text>
            <Input
              width="60%"
              id="displayName"
              name="displayName"
              type="text"
              onChange={userDetailsFormik.handleChange}
              value={userDetailsFormik.values.displayName}
            />
          </Stack>

          <Stack>
            <Text fontSize="xl">Email:</Text>
            <Input
              width="60%"
              id="email"
              name="email"
              type="email"
              onChange={userDetailsFormik.handleChange}
              value={userDetailsFormik.values.email}
            />
          </Stack>

          <Stack>
            <Text fontSize="xl">Language:</Text>
            <Select
              width="60%"
              id="lang"
              name="lang"
              type="text"
              placeholder="Select option"
              onChange={userDetailsFormik.handleChange}
              value={userDetailsFormik.values.lang}
            >
              <option value="en">English</option>
              <option value="fr">French</option>
            </Select>
          </Stack>
          <Button type="submit">Save Changes</Button>
        </Stack>
      </form>

      <Stack Stack p={10} spacing={6} bg="tomato">
      <Text fontSize="2xl" fontWeight="bold" textAlign="center">Account Details</Text>

      </Stack>
      <Stack bg="tomato" height="80px"></Stack>
    </SimpleGrid>
  )
}
