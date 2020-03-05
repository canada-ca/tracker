import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Dmarc_scans


class DmarcRecord(SQLAlchemyObjectType):
    """
    Domain Owner DMARC preferences are stored as DNS TXT records in
    subdomains named "_dmarc".  For example, the Domain Owner of
    "example.com" would post DMARC preferences in a TXT record at
    "_dmarc.example.com". Similarly, a Mail Receiver wishing to query   for
    DMARC preferences regarding mail with an RFC5322.From domain of
    "example.com" would issue a TXT query to the DNS for the subdomain of
    "_dmarc.example.com". The DNS-located DMARC preference data will
    hereafter be called the "DMARC record".
    """
    class Meta:
        model = Dmarc_scans
        exclude_fields = (
            "id", "dmarc_scan"
        )
    record = graphene.String(description="Record value retrieved during scan")

    with app.app_context():
        def resolve_record(self: Dmarc_scans, info):
            return self.dmarc_scan["dmarc"]["record"]
