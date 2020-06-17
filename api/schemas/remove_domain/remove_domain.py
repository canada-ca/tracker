import graphene
from graphql import GraphQLError

from db import db_session
from functions.auth_wrappers import require_token
from functions.auth_functions import is_user_write
from functions.input_validators import cleanse_input
from models import (
    Domains,
    Web_scans,
    Mail_scans,
    Dkim_scans,
    Dmarc_scans,
    Https_scans,
    Mx_scans,
    Spf_scans,
    Ssl_scans,
)
from scalars.url import URL


class RemoveDomain(graphene.Mutation):
    """
    This mutation allows the removal of unused domains
    """

    class Arguments:
        url = URL(description="URL of domain that is being removed", required=True)

    status = graphene.Boolean()

    @require_token
    def mutate(self, info, **kwargs):
        user_roles = kwargs.get("user_roles")
        domain = cleanse_input(kwargs.get("url"))

        # Check to see if domain exists
        domain_orm = Domains.query.filter(Domains.domain == domain).first()

        # Check to see if domain exists
        if domain_orm is None:
            raise GraphQLError("Error, unable to remove domain.")

        # Check permissions
        if is_user_write(user_roles=user_roles, org_id=domain_orm.organization_id):
            try:
                # Get Domain Id
                domain_id = Domains.query.filter(Domains.domain == domain).first().id

                # Get All Web Scans
                webscans = (
                    db_session.query(Web_scans)
                    .filter(Web_scans.domain_id == domain_id)
                    .all()
                )

                # Remove all related web scans
                for scan in webscans:
                    try:
                        Https_scans.query.filter(Https_scans.id == scan.id).delete()
                        Ssl_scans.query.filter(Ssl_scans.id == scan.id).delete()
                        Web_scans.query.filter(Web_scans.id == scan.id).delete()
                    except Exception as e:
                        return RemoveDomain(status=False)

                # Get all Mail Scans
                mailscans = (
                    db_session.query(Mail_scans)
                    .filter(Mail_scans.domain_id == domain_id)
                    .all()
                )

                # Remove all related mail scans
                for scan in mailscans:
                    try:
                        Dkim_scans.query.filter(Dkim_scans.id == scan.id).delete()
                        Dmarc_scans.query.filter(Dmarc_scans.id == scan.id).delete()
                        Mx_scans.query.filter(Mx_scans.id == scan.id).delete()
                        Spf_scans.query.filter(Spf_scans.id == scan.id).delete()
                        Mail_scans.query.filter(Mail_scans.id == scan.id).delete()
                    except Exception as e:
                        return RemoveDomain(status=False)

                Domains.query.filter(Domains.domain == domain).delete()
                db_session.commit()
                return RemoveDomain(status=True)

            except Exception as e:
                db_session.rollback()
                db_session.flush()
                return RemoveDomain(status=False)
        else:
            raise GraphQLError("Error, unable to remove domain.")
