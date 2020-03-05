import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Spf_scans


class SPFRecord(SQLAlchemyObjectType):
    """
    An SPF record is a DNS record that declares which hosts are, and are
    not, authorized to use a domain name for the "HELO" and "MAIL FROM"
    identities. Loosely, the record partitions hosts into permitted and
    not-permitted sets (though some hosts might fall into neither category).
    """
    class Meta:
        model = Spf_scans
        exclude_fields = (
            "id", "spf_scan"
        )
    record = graphene.String(description="The record value retrieved during scan")

    with app.app_context():
        def resolve_record(self: Spf_scans, info):
            return self.spf_scan["spf"]["record"]
