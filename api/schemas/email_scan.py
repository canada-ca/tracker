import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.types import ORMField
from sqlalchemy.orm import load_only

from models import Scans, Domains

from schemas.dmarc import Dmarc

from manage import app
from db import db


class EmailScan(SQLAlchemyObjectType):
    class Meta:
        model = Scans
        interfaces = (relay.Node,)
        exclude_fields = (
            "id", "domain_id",
            "scan_date", "initiated_by"
        )
    domain = graphene.String()
    timestamp = graphene.DateTime()
    dmarc = graphene.Field(Dmarc)

    def resolve_timestamp(self: Scans, info):
        with app.app_context():
            db.init_app(app)
            timestamp = db.session.query(Scans).filter(
                Scans.id == self.id
            ).options(load_only('scan_date')).first()
            return timestamp.scan_date

    def resolve_domain(self: Scans, info):
        with app.app_context():
            db.init_app(app)
            domain = db.session.query(Domains).filter(
                Domains.id == self.domain_id
            ).options(load_only('domain')).first()
            return domain.domain



