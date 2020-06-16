# Utility Imports
import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField
from scalars.email_address import EmailAddress
from scalars.slug import Slug
from enums.roles import RoleEnums

# --- Query Imports ---
# Domain Imports
from schemas.domain import Domain
from resolvers.domains import resolve_domain, resolve_domains

# Get Dmarc Report Bar Graph Data
from schemas.dmarc_report_summary_list import (
    get_dmarc_report_churro_chart,
    demo_get_dmarc_report_churro_chart,
)

# Get Dmarc Report Detail Tables
from schemas.dmarc_report_detail_tables import (
    dmarc_report_detail_tables,
    demo_dmarc_report_detail_tables,
)

# Get Dmarc Report Doughnut Data
from schemas.dmarc_report_summary import (
    get_dmarc_report_doughnut,
    demo_get_dmarc_report_doughnut,
)

# Is User an Admin Query
from schemas.is_user_admin import is_user_admin

# Organization Imports
from schemas.organizations import Organization
from resolvers.organizations import resolve_organization, resolve_organizations

# User List Imports
from schemas.user_list import user_list, resolve_user_list

# User Page Imports
from schemas.user_page import user_page, resolve_user_page

# Need to be updated
from schemas.users import Users
from resolvers.users import resolve_users
from schemas.User.user import User
from resolvers.user import resolve_user
from resolvers.notification_emails import (
    resolve_send_password_reset,
    resolve_send_validation_email,
)
from resolvers.user_affiliations import resolve_test_user_claims
from resolvers.user import resolve_generate_otp_url
from schemas.notification_email import NotificationEmail

# --- End Query Imports ---


# --- Mutation Imports ---
# Authentication Mutations
from schemas.authenticate import Authenticate
from schemas.sign_up.sign_up import SignUp

# Domain Mutations
from schemas.create_domain import CreateDomain
from schemas.remove_domain import RemoveDomain
from schemas.update_domain import UpdateDomain

# Organization Mutations
from schemas.create_organization import CreateOrganization
from schemas.remove_organization import RemoveOrganization
from schemas.update_organization import UpdateOrganization

# Request Scan Mutation
from schemas.scans_mutation import RequestScan

# Verify Account Through Email
from schemas.email_verify_account.email_verify_account import EmailVerifyAccount

# Re-send verification email
from schemas.send_email_verification.send_email_verification import (
    SendEmailVerification,
)

# Update User Role Mutation
from schemas.user_affiliations import UpdateUserRole

# Need to be updated
from schemas.user import (
    UpdateUserPassword,
    ValidateTwoFactor,
)

# --- End Mutation Imports ---


class Query(graphene.ObjectType):
    """The central gathering point for all of the GraphQL queries."""

    node = relay.Node.Field()

    # --- Start User Queries ---

    users = SQLAlchemyConnectionField(
        Users._meta.connection,
        org_slug=graphene.Argument(Slug, required=True),
        sort=None,
        description="Select list of users belonging to an organization.",
    )

    def resolve_users(self, info, **kwargs):
        return resolve_users(self, info, **kwargs)

    user = graphene.List(
        lambda: User,
        user_name=graphene.Argument(EmailAddress, required=False),
        description="Query the currently logged in user if no user name is"
        "given, or query a specific user by user name.",
    )

    def resolve_user(self, info, **kwargs):
        return resolve_user(self, info, **kwargs)

    # User Page Query
    user_page = user_page

    def resolve_user_page(self, info, **kwargs):
        return resolve_user_page(self, info, **kwargs)

    user_list = user_list

    def resolve_user_list(self, info, **kwargs):
        return resolve_user_list(self, info, **kwargs)

    # Is user an admin or super admin
    is_user_admin = is_user_admin

    # --- End User Queries

    # --- Start Organization Queries ---
    organization = SQLAlchemyConnectionField(
        Organization._meta.connection,
        slug=graphene.Argument(Slug, required=True),
        sort=None,
        description="Select all information on a selected organization that a "
        "user has access to.",
    )

    def resolve_organization(self, info, **kwargs):
        return resolve_organization(self, info, **kwargs)

    organizations = SQLAlchemyConnectionField(
        Organization._meta.connection,
        sort=None,
        description="Select all information on all organizations that a user "
        "has access to.",
    )

    def resolve_organizations(self, info, **kwargs):
        return resolve_organizations(self, info, **kwargs)

    # --- End Organization Queries ---

    # --- Start Domain Queries ---
    domain = graphene.List(
        lambda: Domain,
        url_slug=graphene.Argument(Slug, required=True),
        description="Select information on a specific domain.",
    )

    def resolve_domain(self, info, **kwargs):
        return resolve_domain(self, info, **kwargs)

    domains = SQLAlchemyConnectionField(
        Domain._meta.connection,
        org_slug=graphene.Argument(Slug, required=False),
        sort=None,
        description="Select information on an organizations domains, or all "
        "domains a user has access to.",
    )

    def resolve_domains(self, info, **kwargs):
        return resolve_domains(self, info, **kwargs)

    # --- End Domain Queries ---

    # --- Start Get Dmarc Report Bar Graph ---
    get_dmarc_report_churro_chart = get_dmarc_report_churro_chart
    demo_get_dmarc_report_churro_chart = demo_get_dmarc_report_churro_chart

    # --- Start Get Dmarc Report Detailed Table
    dmarc_report_detail_tables = dmarc_report_detail_tables
    demo_dmarc_report_detail_tables = demo_dmarc_report_detail_tables

    # --- Start Get Dmarc Report Doughnut ---
    get_dmarc_report_doughnut = get_dmarc_report_doughnut
    demo_get_dmarc_report_doughnut = demo_get_dmarc_report_doughnut

    # -- End Dmarc Report Queries

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
    authenticate = Authenticate.Field(
        description="Allows users to give their credentials and be " "authenticated"
    )
    sign_up = SignUp.Field(description="Allows users to sign up to our service")
    email_verify_account = EmailVerifyAccount.Field(
        description="Allows users to use token sent through email to verify their account."
    )
    send_email_verification = SendEmailVerification.Field(
        description="Allows users to resend verification if failed during sign-up"
    )


schema = graphene.Schema(query=Query, mutation=Mutation)
