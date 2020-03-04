import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField


from model_enums.groups import GroupEnums
from model_enums.organiztions import OrganizationsEnum

from model_enums.sectors import SectorEnums, ZoneEnums
from resolvers.domains import (
    resolve_get_domain_by_id,
    resolve_get_domain_by_domain,
    resolve_get_domain_by_organization
)
from model_enums.roles import RoleEnums

from schemas.user import (
    UserConnection,
    CreateUser,
    SignInUser,
    UpdateUserPassword,
    ValidateTwoFactor
)
from schemas.user_affiliations import (
    UpdateUserRole
)

from resolvers.groups import (
    resolve_get_group_by_id,
    resolve_get_group_by_group,
    resolve_get_group_by_sector

)
from resolvers.notification_emails import (
    resolve_send_password_reset,
    resolve_send_validation_email
)

from resolvers.users import (
   resolve_generate_otp_url
)

from resolvers.user_affiliations import (
    resolve_test_user_claims
)
from resolvers.organizations import (
    resolve_get_org_by_id,
    resolve_get_org_by_org,
    resolve_get_orgs_by_group
)
from resolvers.scans import (
    resolve_get_scan_by_id,
    resolve_get_scans_by_date,
    resolve_get_scans_by_date_range,
    resolve_get_scans_by_domain,
    resolve_get_scans_by_user_id
)
from resolvers.sectors import (
    resolve_get_sector_by_id,
    resolve_get_sectors_by_sector,
    resolve_get_sector_by_zone
)
from resolvers.users import (
    resolve_generate_otp_url,
)
from scalars.email_address import EmailAddress
from scalars.url import URL
from schemas.domains import Domains, DomainManagement
from schemas.groups import Groups
from schemas.notification_email import (NotificationEmail)
from schemas.organizations import Organizations
from schemas.scans import Scans
from schemas.sectors import Sectors

from schemas.email_scan import EmailScan

from schemas.user import (
    UserObject,
    CreateUser,
    SignInUser,
    UpdateUserPassword,
    ValidateTwoFactor,
    )


class Query(graphene.ObjectType):
    """The central gathering point for all of the GraphQL queries."""
    node = relay.Node.Field()
    users = SQLAlchemyConnectionField(UserObject._meta.connection, sort=None)
    sector = SQLAlchemyConnectionField(Sectors._meta.connection, sort=None)
    group = SQLAlchemyConnectionField(Groups._meta.connection, sort=None)
    organization = SQLAlchemyConnectionField(Organizations._meta.connection, sort=None)
    domains = SQLAlchemyConnectionField(Domains._meta.connection, sort=None)
    domain_management = SQLAlchemyConnectionField(DomainManagement._meta.connection, sort=None)
    email_scan = SQLAlchemyConnectionField(EmailScan)
    get_sector_by_id = graphene.List(
        of_type=Sectors,
        id=graphene.Argument(graphene.Int, required=True),
        resolver=resolve_get_sector_by_id,
        description="Allows selection of a sector from a given sector ID"
    )
    get_sectors_by_sector = graphene.List(
        of_type=Sectors,
        sector=graphene.Argument(SectorEnums, required=True),
        resolver=resolve_get_sectors_by_sector,
        description="Allows selection of sector information from a given sector enum"
    )
    get_sector_by_zone = graphene.List(
        of_type=Sectors,
        zone=graphene.Argument(ZoneEnums, required=True),
        resolver=resolve_get_sector_by_zone,
        description="Allows selection of all sectors from a given zone enum"
    )
    get_group_by_id = graphene.List(
        of_type=Groups,
        id=graphene.Argument(graphene.Int, required=True),
        resolver=resolve_get_group_by_id,
        description="Allows selection of a group from a given group ID"
    )
    get_group_by_group = graphene.List(
        of_type=Groups,
        group=graphene.Argument(GroupEnums, required=True),
        resolver=resolve_get_group_by_group,
        description="Allows the selection of group information from a given group enum"
    )
    get_group_by_sector = graphene.List(
        of_type=Groups,
        sector=graphene.Argument(SectorEnums, required=True),
        resolver=resolve_get_group_by_sector,
        description="Allows selection of groups from a given sector enum"
    )
    get_org_by_id = graphene.List(
        of_type=Organizations,
        id=graphene.Argument(graphene.Int, required=True),
        resolver=resolve_get_org_by_id,
        description="Allows the selection of an organization from a given ID"
    )
    get_org_by_org = graphene.List(
        of_type=Organizations,
        org=graphene.Argument(OrganizationsEnum, required=True),
        resolver=resolve_get_org_by_org,
        description="Allows the selection of an organization from its given organization code"
    )
    get_org_by_group = graphene.List(
        of_type=Organizations,
        group=graphene.Argument(GroupEnums, required=True),
        resolver=resolve_get_orgs_by_group,
        description="Allows the selection of organizations from a given group"
    )
    get_domain_by_id = graphene.List(
        of_type=Domains,
        id=graphene.Argument(graphene.Int, required=True),
        resolver=resolve_get_domain_by_id,
        description="Allows the selection of a domain from a given ID"
    )
    domain = graphene.List(
        of_type=Domains,
        url=graphene.Argument(URL, required=True),
        resolver=resolve_get_domain_by_domain,
        description="Allows the selection of a domain from a given domain"
    )
    get_domain_by_organization = graphene.List(
        of_type=Domains,
        org=graphene.Argument(OrganizationsEnum, required=True),
        resolver=resolve_get_domain_by_organization,
        description="Allows the selection of domains under an organization"
    )
    get_scan_by_id = graphene.List(
        of_type=Scans,
        id=graphene.Argument(graphene.Int, required=True),
        resolver=resolve_get_scan_by_id,
        description="Allows the selection of a scan from a given scan ID"
    )
    get_scans_by_date = graphene.List(
        of_type=Scans,
        date=graphene.Argument(graphene.Date, required=True),
        resolver=resolve_get_scans_by_date,
        description="Allows selection of scans on a given date"
    )
    get_scans_by_date_range = graphene.List(
        of_type=Scans,
        startDate=graphene.Argument(graphene.Date, required=True),
        endDate=graphene.Argument(graphene.Date, required=True),
        resolver=resolve_get_scans_by_date_range,
        description="Allows selection of scans from a given date range"
    )
    get_scans_by_domain = graphene.List(
        of_type=Scans,
        url=graphene.Argument(URL, required=True),
        resolver=resolve_get_scans_by_domain,
        description="Allows selection of scans from a given URL"
    )
    get_scans_by_user_id = graphene.List(
        of_type=Scans,
        id=graphene.Argument(graphene.Int, required=True),
        resolver=resolve_get_scans_by_user_id,
        description="Allows selection of scans initiated by a given user"
    )

    generate_otp_url = graphene.String(
        email=graphene.Argument(EmailAddress, required=True),
        resolver=resolve_generate_otp_url,
        description="An api endpoint used to generate a OTP url used for two factor authentication."
    )

    test_user_claims = graphene.String(
        org=graphene.Argument(OrganizationsEnum, required=True),
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


schema = graphene.Schema(query=Query, mutation=Mutation)
