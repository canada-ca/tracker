import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField

from app import app

from scalars.email_address import EmailAddress
from scalars.organization_acronym import Acronym
from scalars.url import URL
from scalars.slug import Slug

from model_enums.roles import RoleEnums

from schemas.user_affiliations import UpdateUserRole

from resolvers.notification_emails import (
    resolve_send_password_reset,
    resolve_send_validation_email,
)

from resolvers.user_affiliations import resolve_test_user_claims
from resolvers.user import resolve_generate_otp_url

from schemas.notification_email import NotificationEmail


from schemas.user import (
    User,
    CreateUser,
    SignInUser,
    UpdateUserPassword,
    ValidateTwoFactor,
)
from resolvers.user import resolve_user


from schemas.domain import Domain
from resolvers.domains import resolve_domain, resolve_domains

from schemas.organizations import Organization
from resolvers.organizations import resolve_organization, resolve_organizations

from schemas.users import Users
from resolvers.users import resolve_users
from schemas.scans_mutation import RequestScan

from schemas.organizations_mutations import (
    CreateOrganization,
    UpdateOrganization,
    RemoveOrganization,
)

from schemas.domains_mutations import CreateDomain, UpdateDomain, RemoveDomain

from schemas.user_page import (
    user_page,
    resolve_user_page
)


class Query(graphene.ObjectType):
    """The central gathering point for all of the GraphQL queries."""

    node = relay.Node.Field()

    # --- Start User Queries ---
    user_page = user_page

    def resolve_user_page(self, info, **kwargs):
        return resolve_user_page(self, info, **kwargs)

    user_page = user_page

    def resolve_user_page(self, info, **kwargs):
        return resolve_user_page(self, info, **kwargs)

    # --- End User Queries

    # --- Start Organization Queries ---
    organization = SQLAlchemyConnectionField(
        Organization._meta.connection,
        slug=graphene.Argument(Slug, required=True),
        sort=None,
        description="Select all information on a selected organization that a "
        "user has access to.",
    )
    with app.app_context():

        def resolve_organization(self, info, **kwargs):
            return resolve_organization(self, info, **kwargs)

    organizations = SQLAlchemyConnectionField(
        Organization._meta.connection,
        sort=None,
        description="Select all information on all organizations that a user "
        "has access to.",
    )
    with app.app_context():

        def resolve_organizations(self, info, **kwargs):
            return resolve_organizations(self, info, **kwargs)

    # --- End Organization Queries ---

    # --- Start Domain Queries ---
    domain = graphene.List(
        lambda: Domain,
        url_slug=graphene.Argument(Slug, required=True),
        description="Select information on a specific domain.",
    )
    with app.app_context():

        def resolve_domain(self, info, **kwargs):
            return resolve_domain(self, info, **kwargs)

    domains = SQLAlchemyConnectionField(
        Domain._meta.connection,
        org_slug=graphene.Argument(Slug, required=False),
        sort=None,
        description="Select information on an organizations domains, or all "
        "domains a user has access to.",
    )
    with app.app_context():

        def resolve_domains(self, info, **kwargs):
            return resolve_domains(self, info, **kwargs)

    # --- End Domain Queries ---

    generate_otp_url = graphene.String(
        email=graphene.Argument(EmailAddress, required=True),
        resolver=resolve_generate_otp_url,
        description="An api endpoint used to generate a OTP url used for two factor authentication.",
    )

    test_user_claims = graphene.String(
        org_slug=graphene.Argument(Slug, required=True),
        role=graphene.Argument(RoleEnums, required=True),
        resolver=resolve_test_user_claims,
        description="An api endpoint to view a current user's claims -- Requires an active JWT.",
    )

    send_password_reset = graphene.Field(
        NotificationEmail,
        email=graphene.Argument(EmailAddress, required=True),
        resolver=resolve_send_password_reset,
        description="An api endpoint that will send an email to a given email address so a user can reset their password for the web app.",
    )

    send_validation_email = graphene.Field(
        NotificationEmail,
        email=graphene.Argument(EmailAddress, required=True),
        resolver=resolve_send_validation_email,
        description="An api endpoint that will send a verification email to a given email address.",
    )


class Mutation(graphene.ObjectType):
    """The central gathering point for all of the GraphQL mutations."""

    create_user = CreateUser.Field()
    sign_in = SignInUser.Field()
    update_password = UpdateUserPassword.Field()
    authenticate_two_factor = ValidateTwoFactor.Field()
    update_user_role = UpdateUserRole.Field()
    create_organization = CreateOrganization.Field(
        description="Allows the creation of an organization inside the " "database.",
    )
    update_organization = UpdateOrganization.Field(
        description="Allows modification of an organization inside the " "database."
    )
    remove_organization = RemoveOrganization.Field(
        description="Allows the removal of an organization inside the database"
    )
    create_domain = CreateDomain.Field(
        description="Allows the creation of domains for a given organization"
    )
    update_domain = UpdateDomain.Field(description="Allows the modification of domains")
    remove_domain = RemoveDomain.Field(
        description="Allows the removal of a given domain"
    )
    request_scan = RequestScan.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
