import React from 'react'
import {Box, Stack, Text, Button} from '@chakra-ui/core'
import {Link as RouteLink} from "react-router-dom";

var QRCode = require('qrcode.react');

export function QRcodePage(props){
  return (
    <Stack spacing={4} mx="auto" alignItems="center">

      <Text alignItems="center" mx="auto" fontSize="2xl" >Scan this QR code with a 2FA app like Authy or Google Authenticator</Text>

      <Box mt={6} mx="auto">
        <QRCode value={props.url} size={256} />
      </Box>

      <Text mt={6} alignItems="center" mx="auto" fontSize="lg" >Your 2FA app will then have a valid code that you can use when you sign in.</Text>

      <Stack spacing={4} isInline>
        <Button width={{ md: 40 }} as={RouteLink} to="/sign-in" variantColor="teal">
            Sign In
        </Button>
        <Button width={{ md: 40 }} as={RouteLink} to="/" variantColor="teal" variant="outline">
            Home
        </Button>
      </Stack>

    </Stack>
  )
}
