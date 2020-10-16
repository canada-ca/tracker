import graphene

from enums.period import PeriodEnums
from scalars.year import Year


class DmarcReportSummaryTableObject(graphene.ObjectType):
    """
    Object type used to fill list in dmarc report summary table
    """

    domain = graphene.String(description="The domain the data belongs to.")
    total_messages = graphene.Int(
        description="The total amount of messages sent by this domain."
    )
    full_pass_percentage = graphene.Int(
        description="Percentage of messages that are a full pass."
    )
    pass_spf_only_percentage = graphene.Int(
        description="Percentage of messages that are passing only spf."
    )
    pass_dkim_only_percentage = graphene.Int(
        description="Percentage of messages that are passing only dkim."
    )
    fail_percentage = graphene.Int(
        description="Percentage of messages that are failing all checks."
    )

    def resolve_domain(self: dict, info):
        return self.get("domain")

    def resolve_total_messages(self: dict, info):
        total_messages = sum(
            (
                self.get("categoryTotals", {}).get("fullPass", 0),
                self.get("categoryTotals", {}).get("passSpfOnly", 0),
                self.get("categoryTotals", {}).get("passDkimOnly", 0),
                self.get("categoryTotals", {}).get("fail", 0),
            )
        )
        return total_messages

    def resolve_full_pass_percentage(self: dict, info):
        total_messages = sum(
            (
                self.get("categoryTotals", {}).get("fullPass", 0),
                self.get("categoryTotals", {}).get("passSpfOnly", 0),
                self.get("categoryTotals", {}).get("passDkimOnly", 0),
                self.get("categoryTotals", {}).get("fail", 0),
            )
        )

        full_pass = self.get("categoryTotals", {}).get("fullPass", 0)
        if full_pass == 0:
            return 0

        percentage = round((full_pass / total_messages) * 100)
        return percentage

    def resolve_pass_spf_only_percentage(self: dict, info):
        total_messages = sum(
            (
                self.get("categoryTotals", {}).get("fullPass", 0),
                self.get("categoryTotals", {}).get("passSpfOnly", 0),
                self.get("categoryTotals", {}).get("passDkimOnly", 0),
                self.get("categoryTotals", {}).get("fail", 0),
            )
        )

        pass_spf_only = self.get("categoryTotals", {}).get("passSpfOnly", 0)
        if pass_spf_only == 0:
            return 0

        percentage = round((pass_spf_only / total_messages) * 100)
        return percentage

    def resolve_pass_dkim_only_percentage(self: dict, info):
        total_messages = sum(
            (
                self.get("categoryTotals", {}).get("fullPass", 0),
                self.get("categoryTotals", {}).get("passSpfOnly", 0),
                self.get("categoryTotals", {}).get("passDkimOnly", 0),
                self.get("categoryTotals", {}).get("fail", 0),
            )
        )

        pass_dkim_only = self.get("categoryTotals", {}).get("passDkimOnly", 0)

        if pass_dkim_only == 0:
            return 0

        percentage = round((pass_dkim_only / total_messages) * 100)
        return percentage

    def resolve_fail_percentage(self: dict, info):
        total_messages = sum(
            (
                self.get("categoryTotals", {}).get("fullPass", 0),
                self.get("categoryTotals", {}).get("passSpfOnly", 0),
                self.get("categoryTotals", {}).get("passDkimOnly", 0),
                self.get("categoryTotals", {}).get("fail", 0),
            )
        )

        fail = self.get("categoryTotals", {}).get("fail", 0)
        if fail == 0:
            return 0

        percentage = round((fail / total_messages) * 100)
        return percentage


class DmarcReportSummaryTable(graphene.ObjectType):
    """
    A query used to create a table of a list of domains
    """

    month = graphene.String(description="Which month the data is relevant to.")
    year = Year(description="Which year the data is relevant to.")
    domains = graphene.List(
        lambda: DmarcReportSummaryTableObject,
        description="List for creating dmarc summary table.",
    )
