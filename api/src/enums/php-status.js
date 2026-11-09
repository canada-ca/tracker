import { GraphQLEnumType } from 'graphql'

export const PhpStatusEnum = new GraphQLEnumType({
  name: 'PhpStatusEnum',
  values: {
    VULNERABLE: {
      value: 'vulnerable',
      description: 'The PHP version shown is affected by at least one open advisory.',
    },
    UNKNOWN_VERSION: {
      value: 'unknown_version',
      description:
        'PHP is in use, but no version, or one too incomplete to check against the open advisories, is shown.',
    },
    NOT_AFFECTED: {
      value: 'not_affected',
      description: 'The PHP version shown is not affected by any open advisory.',
    },
  },
  description: 'Whether the PHP version a domain shows is affected by the open PHP advisories.',
})
