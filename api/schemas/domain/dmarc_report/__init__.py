import graphene

from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app

from models import Dmarc_Reports

from schemas.domain.dmarc_report.records import Record


class DmarcReport(SQLAlchemyObjectType):
    """
    Generated DMARC Aggregated Report Object
    """
    class Meta:
        model = Dmarc_Reports
        interfaces = (relay.Node, )
        exclude_fields = (
            'id',
            'start_date',
            'end_date',
            'report'
        )
    report_id = graphene.String(
        description="ID of the report."
    )
    org_name = graphene.String(
        description="The organization name the report was generated from."
    )
    org_email = graphene.String(
        description="The organization email name the report was generated from."
    )
    start_date = graphene.DateTime(
        description="Start date & time of aggregate report"
    )
    end_date = graphene.DateTime(
        description="End date & time of aggregate report"
    )
    errors = graphene.List(
        lambda: graphene.String,
        description="Errors that occurred during the report generation"
    )
    records = graphene.List(
        lambda: Record,
        description="Aggregate report records"
    )

    with app.app_context():
        def resolve_report_id(self: Dmarc_Reports, info):
            return self.report['report_metadata']['report_id']

        def resolve_org_name(self: Dmarc_Reports, info):
            return self.report['report_metadata']['org_name']

        def resolve_org_email(self: Dmarc_Reports, info):
            return self.report['report_metadata']['org_email']

        def resolve_start_date(self: Dmarc_Reports, info):
            return self.start_date

        def resolve_end_date(self: Dmarc_Reports, info):
            return self.end_date

        def resolve_errors(self: Dmarc_Reports, info):
            return self.report['report_metadata']['errors']

        def resolve_records(self: Dmarc_Reports, info):
            rtr_list = []
            for record in self.report['records']:
                rtr_list.append(Record(
                    record['count'],
                    record['source'],
                    record['alignment'],
                    record['policy_evaluated'],
                    record['identifiers'],
                    record['auth_results']
                ))
            return rtr_list


class DmarcReportConnection(relay.Connection):
    class Meta:
        node = DmarcReport
