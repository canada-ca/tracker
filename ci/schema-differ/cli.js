#!/usr/bin/env node
'use strict'
const meow = require('meow')
const { diff } = require('.')

const cli = meow(
  `
    Usage
      $ diff-schema <schema.json> <other-schema.graphql>

    Options
      --fail, -f  Fail (exit(1)) if there are breaking changes

    Examples
      $ diff-schema schema.json schema.faker.graphql
`,
  {
    flags: {
      fail: {
        type: 'boolean',
        default: false,
        alias: 'f'
      },
    },
  },
)
/*
{
    input: ['unicorns'],
    flags: {rainbow: true},
    ...
}
*/

diff(cli.input, cli.flags)
