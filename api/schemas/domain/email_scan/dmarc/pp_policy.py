import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Dmarc_scans


class PPPolicy(SQLAlchemyObjectType):
    """
    This is the tag that indicates the requested policy you wish mailbox
    providers to apply when your email fails DMARC authentication and
    alignment checks. The policy is applied to a primary domain (example.com)
    and all of its subdomains (m.example.com, b.example.com, etc), unless the
    sp tag is used (SPPolicy Description) with a different policy value.
    """
    class Meta:
        model = Dmarc_scans
        exclude_fields = (
            "id", "dmarc_scan"
        )
    value = graphene.String()

    with app.app_context():
        def resolve_value(self: Dmarc_scans, info):
            return self.dmarc_scan["dmarc"]["tags"]["p"]["value"]
