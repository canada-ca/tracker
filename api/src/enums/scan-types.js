import { GraphQLEnumType } from 'graphql'

export const ScanTypeEnums = new GraphQLEnumType({
  name: 'ScanTypeEnums',
  values: {
    MAIL: {
      value: 'mail',
      description:
        'Used for defining if DMARC and DKIM scans should be preformed.',
    },
    WEB: {
      value: 'web',
      description:
        'Used for defining if HTTPS and SSL scans should be preformed.',
    },
  },
  description:
    'Enum used when requesting a manual scan to determine what type of scan is to be ran.',
})
