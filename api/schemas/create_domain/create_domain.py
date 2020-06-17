import graphene
from graphql import GraphQLError

from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_user_write
from functions.input_validators import cleanse_input, cleanse_input_list
from models import (
    Organizations,
    Domains,
)
from scalars.url import URL
from scalars.slug import Slug
from scalars.selectors import Selectors


class CreateDomain(graphene.Mutation):
    """
    Mutation used to create a new domain for an organization
    """

    class Arguments:
        org_slug = Slug(
            description="Organizations slug that you would like to connect "
            "this domain to.",
            required=True,
        )
        url = URL(
            description="URL that you would like to be added to database.",
            required=True,
        )
        selectors = Selectors(
            description="DKIM selector strings corresponding to this domain",
            required=False,
        )

    status = graphene.Boolean()

    @require_token
    def mutate(self, info, **kwargs):
        user_roles = kwargs.get("user_roles")
        org_slug = cleanse_input(kwargs.get("org_slug"))
        domain = cleanse_input(kwargs.get("url"))
        selectors = cleanse_input_list(kwargs.get("selectors", []))

        # Check to see if org acronym is SA Org
        if org_slug == "super-admin":
            raise GraphQLError("Error, unable to create domain.")

        # Check to see if org exists
        org_orm = (
            db_session.query(Organizations)
            .filter(Organizations.slug == org_slug)
            .first()
        )

        if org_orm is None:
            raise GraphQLError("Error, unable to create domain.")
        org_id = org_orm.id

        # Check to see if domain exists
        domain_orm = db_session.query(Domains).filter(Domains.domain == domain).first()

        if domain_orm is not None:
            raise GraphQLError("Error, unable to create domain.")

        if is_user_write(user_roles=user_roles, org_id=org_id):
            new_domain = Domains(
                domain=domain, selectors=selectors, organization_id=org_id
            )
            try:
                db_session.add(new_domain)
                db_session.commit()
                return CreateDomain(status=True)
            except Exception as e:
                db_session.rollback()
                db_session.flush()
                return CreateDomain(status=False)
        else:
            raise GraphQLError("Error, unable to create domain.")
