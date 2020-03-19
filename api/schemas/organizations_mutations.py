import graphene

from graphql import GraphQLError

from app import app
from db import db

from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin
from functions.input_validators import cleanse_input

from model_enums.organiztions import OrganizationsEnum

from models import Organizations

from scalars.organization_acronym import Acronym


class CreateOrganization(graphene.Mutation):
    """
    Mutation allows the creation of an organization inside the database.
    """
    class Arguments:
        acronym = Acronym(
            description="Acronym of organization.",
            required=True
        )
        description = graphene.String(
            description="Full name of organization.",
            required=True
        )
        zone = graphene.String(
            description="The zone which the organization belongs to.",
            required=True
        )
        sector = graphene.String(
            description="The sector which the organization belongs to.",
            required=True
        )
        province = graphene.String(
            description="The province in which the organization is located in.",
            required=True
        )
        city = graphene.String(
            description="The city in which the organization is located in.",
            required=True
        )

    # If the update passed or failed
    status = graphene.Boolean()

    with app.app_context():
        @require_token
        def mutate(self, info, **kwargs):
            user_id = kwargs.get('user_id')
            acronym = cleanse_input(kwargs.get('acronym'))
            description = cleanse_input(kwargs.get('description'))
            zone = cleanse_input(kwargs.get('zone'))
            province = cleanse_input(kwargs.get('province'))
            city = cleanse_input(kwargs.get('city'))

            if is_super_admin(user_id):
                org_tags = {
                    "description": description,
                    "zone": zone,
                    "province": province,
                    "city": city
                }
                # TODO Add check to see if org already exists
                new_org = Organizations(
                    acronym=acronym,
                    org_tags=org_tags
                )
                db.session.add(new_org)
                # Push update to db and return status
                try:
                    db.session.commit()
                    return CreateOrganization(status=True)
                except Exception as e:
                    db.session.rollback()
                    db.session.flush()
                    return CreateOrganization(status=False)
            else:
                raise GraphQLError(
                    "Error, you do not have permission to create organizations"
                )


class UpdateOrganization(graphene.Mutation):
    class Arguments:
        acronym = Acronym(
            description="Organization that will be updated.",
            required=True
        )
        description = graphene.String(
            description="Full name of organization.",
            required=False
        )
        zone = graphene.String(
            description="The zone which the organization belongs to.",
            required=False
        )
        sector = graphene.String(
            description="The sector which the organization belongs to.",
            required=False
        )
        province = graphene.String(
            description="The province in which the organization is located in.",
            required=False
        )
        city = graphene.String(
            description="The city in which the organization is located in.",
            required=False
        )

    # If the update passed or failed
    status = graphene.Boolean()

    with app.app_context():
        @require_token
        def mutate(self, info, **kwargs):
            # Get arguments from mutation
            user_id = kwargs.get('user_id')
            acronym = kwargs.get('acronym')
            description = cleanse_input(kwargs.get('description', ""))
            zone = cleanse_input(kwargs.get('zone', ""))
            province = cleanse_input(kwargs.get('province', ""))
            city = cleanse_input(kwargs.get('city', ""))

            if is_super_admin(user_id):

                # Get requested org orm
                org_orm = db.session.query(Organizations).filter(
                    Organizations.acronym == acronym
                ).first()

                # Check to see if org exists
                if org_orm is None:
                    raise GraphQLError("Error, organization does not exist.")

                # Generate org tags
                org_tags = {
                    "description": description,
                    "zone": zone,
                    "province": province,
                    "city": city
                }

                # Update orm
                Organizations.query.filter(
                    Organizations.acronym == acronym
                ).update(
                    {'org_tags': org_tags}
                )

                # Push update to db and return status
                try:
                    db.session.commit()
                    return UpdateOrganization(status=True)
                except Exception as e:
                    db.session.rollback()
                    db.session.flush()
                    return UpdateOrganization(status=False)
            else:
                raise GraphQLError(
                    "Error, you do not have permission to create organizations"
                )
