import graphene

from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from db import db

from models import Dmarc_Reports


class DmarcReport(SQLAlchemyObjectType):
    class Meta:
        model = Dmarc_Reports
        interfaces = (relay.Node, )
        exclude_fields = (
            'id',
            'start_date',
            'end_date',
            'report'
        )
    report_id = graphene.String()
    org_name = graphene.String()
    org_email = graphene.String()
    start_date = graphene.DateTime()
    end_date = graphene.DateTime()
    errors = graphene.List(lambda: graphene.String)

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


class DmarcReportConnection(relay.Connection):
    class Meta:
        node = DmarcReport
