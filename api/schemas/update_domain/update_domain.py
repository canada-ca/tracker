import graphene

from graphql import GraphQLError

from app import logger
from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_user_write
from functions.input_validators import cleanse_input, cleanse_input_list
from functions.slugify import slugify_value
from models import Domains
from scalars.url import URL
from scalars.selectors import Selectors


class UpdateDomainInput(graphene.InputObjectType):
    """
    Input object used to define the argument fields for the updateDomain
    mutation
    """

    current_url = URL(
        description="The current domain that is being requested to be updated.",
        required=True,
    )
    updated_url = URL(
        description="The new domain you wish to update the current domain to be.",
        required=True,
    )
    updated_selectors = Selectors(
        description="The new DKIM selector strings corresponding to this domain",
        required=False,
    )


class UpdateDomain(graphene.Mutation):
    """
    Mutation allows the modification of domains if domain is updated through
    out its life-cycle
    """

    class Arguments:
        input = UpdateDomainInput(
            required=True,
            description="updateDomain input object containing all arguement fields.",
        )

    status = graphene.Boolean()

    @require_token
    def mutate(self, info, **kwargs):
        user_id = kwargs.get("user_id")
        user_roles = kwargs.get("user_roles")
        current_domain = cleanse_input(kwargs.get("input", {}).get("current_url"))
        updated_domain = cleanse_input(kwargs.get("input", {}).get("updated_url"))
        updated_selectors = cleanse_input_list(
            kwargs.get("input", {}).get("updated_selectors", [])
        )

        # Check to see if current domain exists
        domain_orm = Domains.query.filter(Domains.domain == current_domain).first()

        if domain_orm is None:
            logger.warning(
                f"User: {user_id} tried to update {current_domain} but the domain does not exist."
            )
            raise GraphQLError("Error, unable to update domain.")

        if is_user_write(user_roles=user_roles, org_id=domain_orm.organization_id):
            Domains.query.filter(Domains.domain == current_domain).update(
                {
                    "domain": updated_domain,
                    "selectors": updated_selectors,
                    "slug": slugify_value(updated_domain),
                }
            )

            try:
                db_session.commit()
                logger.info(f"User: {user_id} successfully updated {domain_orm.domain}")
                return UpdateDomain(status=True)
            except Exception as e:
                db_session.rollback()
                db_session.flush()
                logger.error(
                    f"A database error occurred when user: {user_id} tried to update {current_domain} error: {str(e)}"
                )
                return UpdateDomain(status=False)
        else:
            logger.warning(
                f"User: {user_id} tried to update {current_domain} but does not have permissions to {domain_orm.organization.slug}."
            )
            raise GraphQLError("Error, unable to update domain.")
