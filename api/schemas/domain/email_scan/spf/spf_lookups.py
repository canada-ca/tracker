import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Spf_scans


class SPFLookups(SQLAlchemyObjectType):
    """
    SPF implementations MUST limit the total number of those terms to 10
    during SPF evaluation, to avoid unreasonable load on the DNS.  If   this
    limit is exceeded, the implementation MUST return "permerror".
    """
    class Meta:
        model = Spf_scans
        exclude_fields = (
            "id", "spf_scan"
        )
    value = graphene.String(description="The current amount of DNS lookups")

    with app.app_context():
        def resolve_value(self: Spf_scans, info):
            return self.spf_scan["spf"]["dns_lookups"]
