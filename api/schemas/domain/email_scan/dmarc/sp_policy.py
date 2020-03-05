import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Dmarc_scans


class SPPolicy(SQLAlchemyObjectType):
    """
    This tag is used to indicate a requested policy for all subdomains where
    mail is failing the DMARC authentication and alignment checks. It is most
    effective when a domain owner wants to specify different policies for the
    primary domain and all subdomains. The policy options are the same as the
    "p" tag listed above. If this tag is not used for subdomains, the policy
    set using the p tag will apply to the primary domain and all of its
    subdomains.
    """
    class Meta:
        model = Dmarc_scans
        exclude_fields = (
            "id", "dmarc_scan"
        )
    value = graphene.String()

    with app.app_context():
        def resolve_value(self: Dmarc_scans, info):
            return self.dmarc_scan["dmarc"]["tags"]["sp"]["value"]
