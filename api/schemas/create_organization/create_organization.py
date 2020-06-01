import graphene
from graphql import GraphQLError

from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin
from functions.input_validators import cleanse_input
from functions.slugify import slugify_value
from models import Organizations
from scalars.organization_acronym import Acronym


class CreateOrganization(graphene.Mutation):
    """
    Mutation allows the creation of an organization inside the database.
    """

    class Arguments:
        acronym = Acronym(description="Acronym of organization.", required=True)
        name = graphene.String(description="Full name of organization.", required=True)
        zone = graphene.String(
            description="The zone which the organization belongs to.", required=True
        )
        sector = graphene.String(
            description="The sector which the organization belongs to.", required=True
        )
        province = graphene.String(
            description="The province in which the organization is located in.",
            required=True,
        )
        city = graphene.String(
            description="The city in which the organization is located in.",
            required=True,
        )

    # If the update passed or failed
    status = graphene.Boolean()

    @require_token
    def mutate(self, info, **kwargs):
        user_roles = kwargs.get("user_roles")
        name = cleanse_input(kwargs.get("name"))
        acronym = cleanse_input(kwargs.get("acronym"))
        zone = cleanse_input(kwargs.get("zone"))
        sector = cleanse_input(kwargs.get("sector"))
        province = cleanse_input(kwargs.get("province"))
        city = cleanse_input(kwargs.get("city"))

        if is_super_admin(user_roles=user_roles):
            # Check to see if organization already exists
            slug = slugify_value(name)
            org_orm = (
                db_session.query(Organizations)
                .filter(Organizations.slug == slug)
                .first()
            )

            if org_orm is not None:
                raise GraphQLError("Error, Organization already exists")

            # Generate org tags
            org_tags = {
                "zone": zone,
                "sector": sector,
                "province": province,
                "city": city,
            }

            # Create new org entry in db
            new_org = Organizations(name=name, acronym=acronym, org_tags=org_tags)

            # Add new org entry into the session
            db_session.add(new_org)

            # Push update to db and return status
            try:
                db_session.commit()
                return CreateOrganization(status=True)
            except Exception as e:
                db_session.rollback()
                db_session.flush()
                return CreateOrganization(status=False)
        else:
            raise GraphQLError(
                "Error, you do not have permission to create organizations"
            )
