import graphene
from graphql import GraphQLError
from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_user_write
from functions.input_validators import cleanse_input
from functions.slugify import slugify_value
from models import Domains
from scalars.url import URL


class UpdateDomain(graphene.Mutation):
    """
    Mutation allows the modification of domains if domain is updated through
    out its life-cycle
    """

    class Arguments:
        current_url = URL(
            description="The current domain that is being requested to be updated.",
            required=True,
        )
        updated_url = URL(
            description="The new domain you wish to update the current domain "
            "to be.",
            required=True,
        )

    status = graphene.Boolean()

    @require_token
    def mutate(self, info, **kwargs):
        user_roles = kwargs.get("user_roles")
        current_domain = cleanse_input(kwargs.get("current_url"))
        updated_domain = cleanse_input(kwargs.get("updated_url"))

        # Check to see if current domain exists
        domain_orm = Domains.query.filter(Domains.domain == current_domain).first()

        if domain_orm is None:
            raise GraphQLError("Error, domain does not exist.")

        if is_user_write(user_roles=user_roles, org_id=domain_orm.organization_id):
            Domains.query.filter(Domains.domain == current_domain).update(
                {"domain": updated_domain, "slug": slugify_value(updated_domain)}
            )

            try:
                db_session.commit()
                return UpdateDomain(status=True)
            except Exception as e:
                db_session.rollback()
                db_session.flush()
                return UpdateDomain(status=False)
        else:
            raise GraphQLError(
                "Error, you do not have permission to edit domains belonging to another organization"
            )
