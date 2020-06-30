import graphene

from graphql import GraphQLError

from app import logger
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


class RemoveOrganizationInput(graphene.InputObjectType):
    """
    Input object containing the required fields for the removeOrganization
    mutation.
    """

    slug = Slug(
        required=True,
        description="The slugified organization name of the organization you"
        " wish to remove.",
    )


class RemoveOrganization(graphene.Mutation):
    """
    Mutation allows the removal of an organization inside the database.
    """

    class Arguments:
        input = RemoveOrganizationInput(
            required=True,
            description="Input fields required for the removeOrganization mutation.",
        )

    status = graphene.Boolean()

    @require_token
    def mutate(self, info, **kwargs):
        # Get arguments from mutation
        user_id = kwargs.get("user_id")
        user_roles = kwargs.get("user_roles")
        slug = cleanse_input(kwargs.get("input", {}).get("slug"))

        # Restrict the deletion of SA Org
        if slug == "super-admin":
            logger.warning(f"User: {user_id} tried to remove super-admin org.")
            raise GraphQLError("Error, unable to remove organization.")

        # Check to see if org exists
        org_orm = (
            db_session.query(Organizations).filter(Organizations.slug == slug).first()
        )

        if org_orm is None:
            logger.warning(
                f"User: {user_id} tried to remove {slug} but org does not exist."
            )
            raise GraphQLError("Error, unable to remove organization.")

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
                                Ssl_scans.query.filter(Ssl_scans.id == scan.id).delete()
                                Web_scans.query.filter(Web_scans.id == scan.id).delete()
                            except Exception as e:
                                logger.error(
                                    f"User: {user_id} tried removing {slug}, but error occured when removing web scans {str(e)}"
                                )
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
                                Mx_scans.query.filter(Mx_scans.id == scan.id).delete()
                                Spf_scans.query.filter(Spf_scans.id == scan.id).delete()
                                Mail_scans.query.filter(
                                    Mail_scans.id == scan.id
                                ).delete()
                            except Exception as e:
                                logger.error(
                                    f"User: {user_id} tried removing {slug}, but error occured when removing mail scans {str(e)}"
                                )
                                return RemoveOrganization(status=False)
                        # Delete Domains
                        try:
                            Domains.query.filter(Domains.id == domain.id).delete()
                        except Exception as e:
                            logger.error(
                                f"User: {user_id} tried removing {slug}, but error occured when removing domains {str(e)}"
                            )
                            return RemoveOrganization(status=False)

                try:
                    # Get all user aff
                    User_affiliations.query.filter(
                        User_affiliations.organization_id == org_orm.id
                    ).delete()
                except Exception as e:
                    logger.error(
                        f"User: {user_id} tried removing {slug}, but error occured when removing user affiliations {str(e)}"
                    )
                    return RemoveOrganization(status=False)

                db_session.delete(org_orm)
                db_session.commit()
                logger.info(
                    f"User: {user_id} successfully removed {slug} organization."
                )
                return RemoveOrganization(status=True)

            except Exception as e:
                db_session.rollback()
                db_session.flush()
                logger.error(
                    f"User: {user_id} tried removing {slug}, but error occured when removing the organization {str(e)}"
                )
                return RemoveOrganization(status=False)
        else:
            logger.warning(
                f"User: {user_id} tried to remove {slug} organization but does not have access to remove organizations."
            )
            raise GraphQLError("Error, unable to remove organization.")
