import graphene
from graphql import GraphQLError

from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin
from functions.input_validators import cleanse_input
from models import (
    Organizations,
    User_affiliations,
    Domains,
    Web_scans,
    Mail_scans,
    Ssl_scans,
    Spf_scans,
    Https_scans,
    Dkim_scans,
    Dmarc_scans,
    Mx_scans,
)
from scalars.slug import Slug


class RemoveOrganization(graphene.Mutation):
    """
    Mutation allows the removal of an organization inside the database.
    """

    class Arguments:
        slug = Slug(description="The organization you wish to remove", required=True)

    status = graphene.Boolean()

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
                        # Get All Web Scans
                        web_scan_orm = Web_scans.query.filter(
                            Web_scans.domain_id == domain.id
                        ).all()
                        # Delete All Related Scans
                        for scan in web_scan_orm:
                            try:
                                Https_scans.query.filter(
                                    Https_scans.id == scan.id
                                ).delete()
                                Ssl_scans.query.filter(
                                    Ssl_scans.id == scan.id
                                ).delete()
                                Web_scans.query.filter(Web_scans.id == scan.id).delete()
                            except Exception as e:
                                print("Scans: " + e)
                                return RemoveOrganization(status=False)

                        # Get All Web Scans
                        mail_scan_orm = Mail_scans.query.filter(
                            Mail_scans.domain_id == domain.id
                        ).all()
                        # Delete All Related Scans
                        for scan in mail_scan_orm:
                            try:
                                Dkim_scans.query.filter(
                                    Dkim_scans.id == scan.id
                                ).delete()
                                Dmarc_scans.query.filter(
                                    Dmarc_scans.id == scan.id
                                ).delete()
                                Mx_scans.query.filter(
                                    Mx_scans.id == scan.id
                                ).delete()
                                Spf_scans.query.filter(
                                    Spf_scans.id == scan.id
                                ).delete()
                                Mail_scans.query.filter(Mail_scans.id == scan.id).delete()
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
