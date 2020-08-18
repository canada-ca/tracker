# Utility Imports
import graphene
from graphene import relay
from scalars.email_address import EmailAddress

# --- Query Imports ---
# Domain Imports
from schemas.find_domain_by_slug import find_domain_by_slug
from schemas.find_domains_by_org import find_domains_by_org, resolve_find_domains_by_org
from schemas.find_my_domains import find_my_domains, resolve_find_my_domains

# Get Dmarc Report Bar Graph Data
from schemas.dmarc_report_summary_list import (
    dmarc_report_summary_list,
    demo_dmarc_report_summary_list,
)

# Get Dmarc Report Detail Tables
from schemas.dmarc_report_detail_tables import (
    dmarc_report_detail_tables,
    demo_dmarc_report_detail_tables,
)

# Get Dmarc Report Doughnut Data
from schemas.dmarc_report_summary import (
    dmarc_report_summary,
    demo_dmarc_report_summary,
)

# Get dmarc report
from schemas.dmarc_report_summary_table import (
    dmarc_report_summary_table,
    demo_dmarc_report_summary_table,
)

# Is User an Admin Query
from schemas.is_user_admin import is_user_admin

# Organization Imports
from schemas.find_organization_detail_by_slug import find_organization_detail_by_slug
from schemas.find_my_organizations import (
    find_my_organizations,
    resolve_find_my_organizations,
)

# Summaries Import
from schemas.email_summary import email_summary, demo_email_summary
from schemas.web_summary import web_summary, demo_web_summary

# Test User Claims
from schemas.test_user_claims import test_user_claims

# User List Imports
from schemas.user_list import user_list, resolve_user_list

# User Page Imports
from schemas.user_page import user_page, resolve_user_page

# Need to be updated
from schemas.user.user import User
from resolvers.user import resolve_user
from resolvers.user import resolve_generate_otp_url

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
from schemas.request_scan import RequestScan

# Verify Account Through Email
from schemas.email_verify_account.email_verify_account import EmailVerifyAccount

# Re-send verification email
from schemas.send_email_verification.send_email_verification import (
    SendEmailVerification,
)

# Send Password Reset Link
from schemas.send_password_reset_email import SendPasswordResetLink

# Update Users Password
from schemas.update_user_password.update_user_password import UpdateUserPassword

# Update User Profile
from schemas.update_user_profile import UpdateUserProfile

# Update User Role Mutation
from schemas.update_user_role import UpdateUserRole

# Validate Two Factor
from schemas.validate_two_factor.validate_two_factor import ValidateTwoFactor

# Invite user to org
from schemas.invite_user_to_org import InviteUserToOrg

# --- End Mutation Imports ---


class Query(graphene.ObjectType):
    """The central gathering point for all of the GraphQL queries."""

    node = relay.Node.Field()

    # --- Start User Queries ---
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

    # Test User Claims
    test_user_claims = test_user_claims

    # --- End User Queries

    # --- Start Organization Queries ---
    find_organization_detail_by_slug = find_organization_detail_by_slug

    find_my_organizations = find_my_organizations

    def resolve_find_my_organizations(self, info, **kwargs):
        return resolve_find_my_organizations(self, info, **kwargs)

    # --- End Organization Queries ---

    # --- Start Domain Queries ---
    find_domain_by_slug = find_domain_by_slug

    find_domains_by_org = find_domains_by_org

    def resolve_find_domains_by_org(self, info, **kwargs):
        return resolve_find_domains_by_org(self, info, **kwargs)

    find_my_domains = find_my_domains

    def resolve_find_my_domains(self, info, **kwargs):
        return resolve_find_my_domains(self, info, **kwargs)

    # --- End Domain Queries ---

    # --- Start Get Dmarc Report Bar Graph ---
    dmarc_report_summary_list = dmarc_report_summary_list
    demo_dmarc_report_summary_list = demo_dmarc_report_summary_list

    # --- Start Get Dmarc Report Detailed Table
    dmarc_report_detail_tables = dmarc_report_detail_tables
    demo_dmarc_report_detail_tables = demo_dmarc_report_detail_tables

    # --- Start Get Dmarc Report Doughnut ---
    dmarc_report_summary = dmarc_report_summary
    demo_dmarc_report_summary = demo_dmarc_report_summary

    # --- End Dmarc Report  Queries ---

    # --- Start Dmarc Report Summary Table ---
    dmarc_report_summary_table = dmarc_report_summary_table
    demo_dmarc_report_summary_table = demo_dmarc_report_summary_table

    # --- End Dmarc Report Summary Table ---

    # -- Start Summaries Queries --
    email_summary = email_summary
    demo_email_summary = demo_email_summary

    web_summary = web_summary
    demo_web_summary = demo_web_summary

    # -- End Summaries Queries --

    generate_otp_url = graphene.String(
        email=graphene.Argument(EmailAddress, required=True),
        resolver=resolve_generate_otp_url,
        description="An api endpoint used to generate a OTP url used for two factor authentication.",
    )


class Mutation(graphene.ObjectType):
    """The central gathering point for all of the GraphQL mutations."""

    authenticate = Authenticate.Field(
        description="Allows users to give their credentials and be authenticated."
    )
    authenticate_two_factor = ValidateTwoFactor.Field(
        description="Allows users to authenticate two-factor for their account."
    )
    create_domain = CreateDomain.Field(
        description="Allows the creation of domains for a given organization."
    )
    create_organization = CreateOrganization.Field(
        description="Allows the creation of an organization inside the database.",
    )
    email_verify_account = EmailVerifyAccount.Field(
        description="Allows users to use token sent through email to verify their account."
    )
    remove_domain = RemoveDomain.Field(
        description="Allows the removal of a given domain."
    )
    remove_organization = RemoveOrganization.Field(
        description="Allows the removal of an organization inside the database."
    )
    request_scan = RequestScan.Field(
        description="This function allows users to request a manual scan of a domain."
    )
    sign_up = SignUp.Field(description="Allows users to sign up to our service.")
    send_email_verification = SendEmailVerification.Field(
        description="Allows users to resend verification if failed during sign-up."
    )
    send_password_reset_link = SendPasswordResetLink.Field(
        description="Allows the user to request an email to reset their account password."
    )
    update_domain = UpdateDomain.Field(
        description="Allows the modification of a given domain."
    )
    update_organization = UpdateOrganization.Field(
        description="Allows modification of an organization inside the database."
    )
    update_password = UpdateUserPassword.Field(
        description="Allows users to update their password, using a token sent to them via email."
    )
    update_user_role = UpdateUserRole.Field(
        description="Updates the users permission to an organization."
    )
    invite_user_to_org = InviteUserToOrg.Field(
        description="Allows org admins to invite other users to their organizations."
    )
    update_user_profile = UpdateUserProfile.Field(
        description="Allows users to update their profile information."
    )


schema = graphene.Schema(query=Query, mutation=Mutation)
