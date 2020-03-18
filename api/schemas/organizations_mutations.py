import graphene

from graphql import GraphQLError

from app import app
from db import db

from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin
from functions.input_validators import cleanse_input

from models import Organizations


class CreateOrganization(graphene.Mutation):
    class Arguments:
        acronym = graphene.String()
        description = graphene.String()
        zone = graphene.String()
        sector = graphene.String()
        province = graphene.String()
        city = graphene.String()

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

                new_org = Organizations(
                    acronym=acronym,
                    org_tags=org_tags
                )
                db.session.add(new_org)
                return db.session.commit()
            else:
                raise GraphQLError(
                    "Error, you do not have permission to create organizations"
                )
