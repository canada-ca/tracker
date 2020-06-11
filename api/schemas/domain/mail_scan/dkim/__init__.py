import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Dkim_scans
from scalars.url import URL
from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp
from schemas.domain.mail_scan.dkim.dkim_tags import DkimTags


class DKIM(SQLAlchemyObjectType):
    """
    DomainKeys Identified Mail (DKIM) permits a person, role, or
    organization that owns the signing domain to claim some
    responsibility for a message by associating the domain with the
    message.  This can be an author's organization, an operational relay,
    or one of their agents.
    """

    class Meta:
        model = Dkim_scans
        exclude_fields = ("id", "dkim_scan")

    id = graphene.ID(description="ID of the object")
    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="Time when scan was initiated")
    record = graphene.String(
        description="DKIM record retrieved during the scan of the " "given domain "
    )
    key_length = graphene.String(description="Length of DKIM public key")
    dkim_guidance_tags = graphene.List(
        lambda: DkimTags, description="Key tags found during scan"
    )

    def resolve_domain(self, info):
        get_domain(self, info)

    def resolve_timestamp(self, info):
        get_timestamp(self, info)

    def resolve_record(self, info):
        return self.dkim_scan["dkim"]["txt_record"]

    def resolve_key_length(self, info):
        return self.dkim_scan["dkim"]["key_size"]

    def resolve_dkim_guidance_tags(self, info):
        return DkimTags.get_query(info).all()
