import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField, SQLAlchemyObjectType

from app import app

from scalars.email_address import EmailAddress
from scalars.organization_acronym import Acronym
from scalars.url import URL

from model_enums.roles import RoleEnums

from schemas.user_affiliations import (
    UpdateUserRole
)

from resolvers.notification_emails import (
    resolve_send_password_reset,
    resolve_send_validation_email
)

from resolvers.user_affiliations import (
    resolve_test_user_claims
)
from resolvers.user import (
    resolve_generate_otp_url,
)

from schemas.notification_email import (NotificationEmail)


from schemas.user import (
    User,
    CreateUser,
    SignInUser,
    UpdateUserPassword,
    ValidateTwoFactor,
)
from resolvers.user import resolve_user


from schemas.domain import Domain
from resolvers.domains import (
    resolve_domain,
    resolve_domains
)

from schemas.organizations import Organization
from resolvers.organizations import (
    resolve_organization,
    resolve_organizations
)

from schemas.users import Users
from resolvers.users import resolve_users

from schemas.organizations_mutations import (
    CreateOrganization,
    UpdateOrganization,
    RemoveOrganization
)

from schemas.domains_mutations import (
    CreateDomain,
    UpdateDomain,
    RemoveDomain
)

from schemas.dmarc_report import DmarcReport
from resolvers.dmarc_report import resolve_dmarc_reports


class Query(graphene.ObjectType):
    """The central gathering point for all of the GraphQL queries."""
    node = relay.Node.Field()

    # --- Start User Queries ---
    users = SQLAlchemyConnectionField(
        Users._meta.connection,
        org=graphene.Argument(Acronym, required=True),
        sort=None,
        description="Select list of users belonging to an organization."
    )
    with app.app_context():
        def resolve_users(self, info, **kwargs):
            return resolve_users(self, info, **kwargs)

    user = graphene.List(
        lambda: User,
        user_name=graphene.Argument(EmailAddress, required=False),
        description="Query the currently logged in user if no user name is"
                    "given, or query a specific user by user name."
    )
    with app.app_context():
        def resolve_user(self, info, **kwargs):
            return resolve_user(self, info, **kwargs)
    # --- End User Queries

    # --- Start Organization Queries ---
    organization = SQLAlchemyConnectionField(
        Organization._meta.connection,
        org=graphene.Argument(Acronym, required=True),
        sort=None,
        description="Select all information on a selected organization that a "
                    "user has access to."
    )
    with app.app_context():
        def resolve_organization(self, info, **kwargs):
            return resolve_organization(self, info, **kwargs)

    organizations = SQLAlchemyConnectionField(
        Organization._meta.connection,
        sort=None,
        description="Select all information on all organizations that a user "
                    "has access to."
    )
    with app.app_context():
        def resolve_organizations(self, info, **kwargs):
            return resolve_organizations(self, info, **kwargs)
    # --- End Organization Queries ---

    # --- Start Domain Queries ---
    domain = SQLAlchemyConnectionField(
        Domain._meta.connection,
        url=graphene.Argument(URL, required=True),
        sort=None,
        description="Select information on a specific domain."
    )
    with app.app_context():
        def resolve_domain(self, info, **kwargs):
            return resolve_domain(self, info, **kwargs)

    domains = SQLAlchemyConnectionField(
        Domain._meta.connection,
        organization=graphene.Argument(Acronym, required=False),
        sort=None,
        description="Select information on an organizations domains, or all "
                    "domains a user has access to."
    )
    with app.app_context():
        def resolve_domains(self, info, **kwargs):
            return resolve_domains(self, info, **kwargs)
    # --- End Domain Queries ---

    generate_otp_url = graphene.String(
        email=graphene.Argument(EmailAddress, required=True),
        resolver=resolve_generate_otp_url,
        description="An api endpoint used to generate a OTP url used for two factor authentication."
    )

    test_user_claims = graphene.String(
        org=graphene.Argument(Acronym, required=True),
        role=graphene.Argument(RoleEnums, required=True),
        resolver=resolve_test_user_claims,
        description="An api endpoint to view a current user's claims -- Requires an active JWT."
    )

    send_password_reset = graphene.Field(
        NotificationEmail,
        email=graphene.Argument(EmailAddress, required=True),
        resolver=resolve_send_password_reset,
        description="An api endpoint that will send an email to a given email address so a user can reset their password for the web app."
    )

    send_validation_email = graphene.Field(
        NotificationEmail,
        email=graphene.Argument(EmailAddress, required=True),
        resolver=resolve_send_validation_email,
        description="An api endpoint that will send a verification email to a given email address."
    )


class Mutation(graphene.ObjectType):
    """The central gathering point for all of the GraphQL mutations."""
    create_user = CreateUser.Field()
    sign_in = SignInUser.Field()
    update_password = UpdateUserPassword.Field()
    authenticate_two_factor = ValidateTwoFactor.Field()
    update_user_role = UpdateUserRole.Field()
    create_organization = CreateOrganization.Field(
        description="Allows the creation of an organization inside the "
                    "database.",
    )
    update_organization = UpdateOrganization.Field(
        description="Allows modification of an organization inside the "
                    "database."
    )
    remove_organization = RemoveOrganization.Field(
        description="Allows the removal of an organization inside the database"
    )
    create_domain = CreateDomain.Field(
        description="Allows the creation of domains for a given organization"
    )
    update_domain = UpdateDomain.Field(
        description="Allows the modification of domains"
    )
    remove_domain = RemoveDomain.Field(
        description="Allows the removal of a given domain"
    )


schema = graphene.Schema(query=Query, mutation=Mutation)
