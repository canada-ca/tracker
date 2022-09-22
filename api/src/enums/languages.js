import {GraphQLEnumType} from 'graphql'

export const LanguageEnums = new GraphQLEnumType({
  name: 'LanguageEnums',
  values: {
    ENGLISH: {
      value: 'english',
      description: 'Used for defining if English is the preferred language.',
    },
    FRENCH: {
      value: 'french',
      description: 'Used for defining if French is the preferred language.',
    },
  },
  description: "An enum used to define user's language.",
})
