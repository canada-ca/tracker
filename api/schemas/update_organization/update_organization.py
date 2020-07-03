import graphene

from graphql import GraphQLError

from app import logger
from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin
from functions.input_validators import cleanse_input
from functions.slugify import slugify_value
from models import Organizations
from scalars.organization_acronym import Acronym
from scalars.slug import Slug


class UpdateOrganizationInput(graphene.InputObjectType):
    """
    Input object used to define the argument fields for the updateOrganization
    mutation.
    """

    slug = Slug(description="Organization that will be updated", required=True)
    acronym = Acronym(
        description="Organization Acronym you would like updated", required=False
    )
    name = graphene.String(description="Full name of organization.", required=False)
    zone = graphene.String(
        description="The zone which the organization belongs to.", required=False
    )
    sector = graphene.String(
        description="The sector which the organization belongs to.", required=False
    )
    province = graphene.String(
        description="The province in which the organization is located in.",
        required=False,
    )
    city = graphene.String(
        description="The city in which the organization is located in.", required=False,
    )


class UpdateOrganization(graphene.Mutation):
    """
    Mutation allows the modification of organizations if any changes to the
    organization may occur.
    """

    class Arguments:
        input = UpdateOrganizationInput(
            required=True,
            description="UpdateOrganizationInput object containing all arguement fields.",
        )

    # If the update passed or failed
    status = graphene.Boolean(
        description="Returns true if organization was successfully updated."
    )

    @require_token
    def mutate(self, info, **kwargs):
        # Get arguments from mutation
        user_id = kwargs.get("user_id")
        user_roles = kwargs.get("user_roles")
        slug = cleanse_input(kwargs.get("input", {}).get("slug"))
        name = cleanse_input(kwargs.get("input", {}).get("name"))
        acronym = cleanse_input(kwargs.get("input", {}).get("acronym"))
        zone = cleanse_input(kwargs.get("input", {}).get("zone"))
        sector = cleanse_input(kwargs.get("input", {}).get("sector"))
        province = cleanse_input(kwargs.get("input", {}).get("province"))
        city = cleanse_input(kwargs.get("input", {}).get("city"))

        # XXX: only the Super User can edit orgs?
        if is_super_admin(user_roles=user_roles):

            # Restrict the deletion of SA Org
            if slug == "super-admin":
                logger.warning(f"User: {user_id} tried to update super-admin org.")
                raise GraphQLError("Error, unable to update organization.")

            # Get requested org orm
            org_orm = (
                db_session.query(Organizations)
                .filter(Organizations.slug == slug)
                .first()
            )

            # Check to see if org exists
            if org_orm is None:
                logger.warning(
                    f"User: {user_id} tried to update {slug} but org does not exist."
                )
                raise GraphQLError("Error, unable to update organization.")

            # Check to see if organization slug already in use
            update_org_orm = (
                db_session.query(Organizations)
                .filter(Organizations.slug == slugify_value(name))
                .filter(Organizations.id != org_orm.id)
                .first()
            )

            if update_org_orm is not None:
                logger.warning(
                    f"User: {user_id} tried to update {slug} but org settings already in use."
                )
                raise GraphQLError("Error, unable to update organization.")

            # Update orm
            org_orm.slug = (
                slugify_value(name) if name != "" else slugify_value(org_orm.name)
            )
            org_orm.name = name if name != "" else org_orm.name
            org_orm.acronym = acronym if acronym != "" else org_orm.acronym
            org_orm.org_tags = {
                "zone": zone if zone != "" else org_orm.org_tags.get("zone"),
                "sector": sector if sector != "" else org_orm.org_tags.get("sector"),
                "province": province
                if province != ""
                else org_orm.org_tags.get("province"),
                "city": city if city != "" else org_orm.org_tags.get("city"),
            }

            # Push update to db and return status

            try:
                db_session.commit()
                logger.info(
                    f"User: {user_id} successfully updated {slug} organization."
                )
                return UpdateOrganization(status=True)
            except Exception as e:
                db_session.rollback()
                db_session.flush()
                logger.error(
                    f"User: {user_id} tried updating {slug}, but error occured when updating the organization {str(e)}"
                )
                return UpdateOrganization(status=False)
        else:
            logger.warning(
                f"User: {user_id} tried to update {slug} organization but does not have access to update organizations."
            )
            raise GraphQLError("Error, unable to update organization.")
