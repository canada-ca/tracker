import graphene

from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from db import db

from models import Dmarc_Reports

from schemas.dmarc_report.errors import Errors


class DmarcReport(SQLAlchemyObjectType):
    class Meta:
        model = Dmarc_Reports
        exclude_fields = (
            'id',
            'start_date',
            'end_date',
            'report'
        )
    id = graphene.ID()
    report_id = graphene.String()
    org_name = graphene.String()
    org_email = graphene.String()
    start_date = graphene.DateTime()
    end_date = graphene.DateTime()
    errors = graphene.List(lambda: Errors)

    with app.app_context():
        def resovle_report_id(self: Dmarc_Reports, info):
            return self.report['report_metadata']['report_id']

        def resolve_org_name(self: Dmarc_Reports, info):
            return self.report['report_metadata']['org_name']

        def resolve_org_email(self: Dmarc_Reports, info):
            return self.report['report_metadata']['org_email']

        def resolve_start_date(self: Dmarc_Reports, info):
            return self.report['report_metadata']['begin_date']

        def resolve_end_date(self: Dmarc_Reports, info):
            return self.report['report_metadata']['end_date']

        def resolve_errors(self: Dmarc_Reports, info):
            rtr_list = []
            for error in self.report['report_metadata']['errors']:
                rtr_list.append(Errors.)
            return
