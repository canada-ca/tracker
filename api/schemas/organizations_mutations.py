import graphene
from graphql import GraphQLError

from app import app
from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin
from functions.input_validators import cleanse_input
from functions.slugify import slugify_value
from models import (
    Organizations,
    User_affiliations,
    Domains,
    Scans,
    Ssl_scans,
    Spf_scans,
    Https_scans,
    Dkim_scans,
    Dmarc_scans,
    Mx_scans,
)
from scalars.organization_acronym import Acronym
from scalars.slug import Slug


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

    with app.app_context():

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


class UpdateOrganization(graphene.Mutation):
    class Arguments:
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
            description="The city in which the organization is located in.",
            required=False,
        )

    # If the update passed or failed
    status = graphene.Boolean()

    with app.app_context():

        @require_token
        def mutate(self, info, **kwargs):
            # Get arguments from mutation
            user_roles = kwargs.get("user_roles")
            slug = cleanse_input(kwargs.get("slug"))
            name = cleanse_input(kwargs.get("name"))
            acronym = cleanse_input(kwargs.get("acronym"))
            zone = cleanse_input(kwargs.get("zone"))
            sector = cleanse_input(kwargs.get("sector"))
            province = cleanse_input(kwargs.get("province"))
            city = cleanse_input(kwargs.get("city"))

            # XXX: only the Super User can edit orgs?
            if is_super_admin(user_roles=user_roles):

                # Restrict the deletion of SA Org
                if slug == "super-admin":
                    raise GraphQLError("Error, you cannot modify this organization")

                # Get requested org orm
                org_orm = (
                    db_session.query(Organizations)
                    .filter(Organizations.slug == slug)
                    .first()
                )

                # Check to see if org exists
                if org_orm is None:
                    raise GraphQLError("Error, organization does not exist.")

                # Check to see if organization slug already in use
                update_org_orm = (
                    db_session.query(Organizations)
                    .filter(Organizations.slug == slugify_value(name))
                    .filter(Organizations.id != org_orm.id)
                    .first()
                )

                if update_org_orm is not None:
                    raise GraphQLError("Error, organization info already in use.")

                # Update orm
                org_orm.slug = (
                    slugify_value(name) if name != "" else slugify_value(org_orm.name)
                )
                org_orm.name = name if name != "" else org_orm.name
                org_orm.acronym = acronym if acronym != "" else org_orm.acronym
                org_orm.org_tags = {
                    "zone": zone if zone != "" else org_orm.org_tags.get("zone"),
                    "sector": sector
                    if sector != ""
                    else org_orm.org_tags.get("sector"),
                    "province": province
                    if province != ""
                    else org_orm.org_tags.get("province"),
                    "city": city if city != "" else org_orm.org_tags.get("city"),
                }

                # Push update to db and return status

                try:
                    db_session.commit()
                    return UpdateOrganization(status=True)
                except Exception as e:
                    db_session.rollback()
                    db_session.flush()
                    return UpdateOrganization(status=False)
            else:
                raise GraphQLError(
                    "Error, you do not have permission to update organizations"
                )


class RemoveOrganization(graphene.Mutation):
    """
    Mutation allows the removal of an organization inside the database.
    """

    class Arguments:
        slug = Slug(description="The organization you wish to remove", required=True)

    status = graphene.Boolean()

    with app.app_context():

        @require_token
        def mutate(self, info, **kwargs):
            # Get arguments from mutation
            user_roles = kwargs.get("user_roles")
            slug = cleanse_input(kwargs.get("slug"))

            # Restrict the deletion of SA Org
            if slug == "super-admin":
                raise GraphQLError("Error, you cannot remove this organization")

            # Check to see if org exists
            org_orm = (
                db_session.query(Organizations)
                .filter(Organizations.slug == slug)
                .first()
            )

            if org_orm is None:
                raise GraphQLError("Error, organization does not exist")

            # Check Permissions
            if is_super_admin(user_roles=user_roles):
                # XXX shouldn't cascade delete do all of this for us?
                try:
                    # Get All Domains
                    domain_orm = Domains.query.filter(
                        Domains.organization_id == org_orm.id
                    ).all()

                    if len(domain_orm) > 0:
                        # Loop Through All Domains
                        for domain in domain_orm:
                            # Get All Scans
                            scan_orm = Scans.query.filter(
                                Scans.domain_id == domain.id
                            ).all()
                            # Delete All Related Scans
                            for scan in scan_orm:
                                try:
                                    Dkim_scans.query.filter(
                                        Dkim_scans.id == scan.id
                                    ).delete()
                                    Dmarc_scans.query.filter(
                                        Dmarc_scans.id == scan.id
                                    ).delete()
                                    Https_scans.query.filter(
                                        Https_scans.id == scan.id
                                    ).delete()
                                    Mx_scans.query.filter(
                                        Mx_scans.id == scan.id
                                    ).delete()
                                    Spf_scans.query.filter(
                                        Spf_scans.id == scan.id
                                    ).delete()
                                    Ssl_scans.query.filter(
                                        Ssl_scans.id == scan.id
                                    ).delete()
                                    Scans.query.filter(Scans.id == scan.id).delete()
                                except Exception as e:
                                    print("Scans: " + e)
                                    return RemoveOrganization(status=False)
                            # Delete Domains
                            try:
                                Domains.query.filter(Domains.id == domain.id).delete()
                            except Exception as e:
                                print("Domain: " + str(e))
                                return RemoveOrganization(status=False)

                    try:
                        # Get all user aff
                        User_affiliations.query.filter(
                            User_affiliations.organization_id == org_orm.id
                        ).delete()
                    except Exception as e:
                        print("user_aff: " + str(e))
                        return RemoveOrganization(status=False)

                    db_session.delete(org_orm)
                    db_session.commit()
                    return RemoveOrganization(status=True)

                except Exception as e:
                    print("organization: " + str(e))
                    db_session.rollback()
                    db_session.flush()
                    return RemoveOrganization(status=False)
            else:
                raise GraphQLError(
                    "Error, you do not have permission to remove organizations."
                )
