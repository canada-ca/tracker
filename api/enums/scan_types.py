import graphene


class ScanTypeEnums(graphene.Enum):
    MAIL = "mail"
    WEB = "web"

    @property
    def description(self):
        if self == ScanTypeEnums.MAIL:
            return "Used for defining if DMARC and DKIM scans should be performed"
        elif self == ScanTypeEnums.WEB:
            return "Used for defining if HTTPS and SSL scans should be performed"
        else:
            return "Error, this enum value does not exist."
