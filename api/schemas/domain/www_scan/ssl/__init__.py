import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Ssl_scans

from scalars.url import URL

from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp


class SSL(SQLAlchemyObjectType):
    class Meta:
        model = Ssl_scans
        exclude_fields = (
            "id", "ssl_scan"
        )
    id = graphene.ID()
    domain = URL()
    timestamp = graphene.DateTime()

    with app.app_context():
        def resolve_domain(self, info):
            return get_domain(self, info)

        def resolve_timestamp(self, info):
            return get_timestamp(self, info)
