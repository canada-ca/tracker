import graphene


class PeriodEnums(graphene.Enum):
    JANUARY = "jan"
    FEBRUARY = "feb"
    MARCH = "mar"
    APRIL = "apr"
    MAY = "may"
    JUNE = "june"
    JULY = "july"
    AUGUST = "aug"
    SEPTEMBER = "sept"
    OCTOBER = "cot"
    NOVEMBER = "nov"
    DECEMBER = "dec"
    LAST30DAYS = "last30days"

    @property
    def description(self):
        if self == PeriodEnums.JANUARY:
            return "The month of January"
        elif self == PeriodEnums.FEBRUARY:
            return "The month of February"
        elif self == PeriodEnums.MARCH:
            return "The month of March"
        elif self == PeriodEnums.APRIL:
            return "The month of April"
        elif self == PeriodEnums.MAY:
            return "The month of May"
        elif self == PeriodEnums.JUNE:
            return "The month of June"
        elif self == PeriodEnums.JULY:
            return "The month of July"
        elif self == PeriodEnums.AUGUST:
            return "The month of August"
        elif self == PeriodEnums.SEPTEMBER:
            return "The month of September"
        elif self == PeriodEnums.OCTOBER:
            return "The month of October"
        elif self == PeriodEnums.NOVEMBER:
            return "The month of November"
        elif self == PeriodEnums.DECEMBER:
            return "The month of December"
        elif self == PeriodEnums.LAST30DAYS:
            return "The last 30 days"
        else:
            return "Error, this enum value does not exist."
