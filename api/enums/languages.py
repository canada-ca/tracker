import graphene


class LanguageEnums(graphene.Enum):
    ENGLISH = "english"
    FRENCH = "french"

    @property
    def description(self):
        if self == LanguageEnums.ENGLISH:
            return "Used for defining if English is the preferred language"
        elif self == LanguageEnums.FRENCH:
            return "Used for defining if French is the preferred language"
        else:
            return "Error, this enum value does not exist."
