import graphene
from graphql import GraphQLError

from app import app
from db import db_session

from functions.auth_wrappers import require_token
from functions.auth_functions import is_user_write
from functions.input_validators import cleanse_input

from models import (
    Organizations,
    Domains,
    Scans,
    Dkim_scans,
    Dmarc_scans,
    Https_scans,
    Mx_scans,
    Spf_scans,
    Ssl_scans

)

from scalars.organization_acronym import Acronym
from scalars.url import URL


class CreateDomain(graphene.Mutation):
    """
    Mutation used to create a new domain for an organization
    """

    class Arguments:
        org = Acronym(
            description="Organizations acronym that you would like to connect "
                        "this domain to.",
            required=True
        )
        url = URL(
            description="URL that you would like to be added to database.",
            required=True
        )

    status = graphene.Boolean()

    with app.app_context():
        @require_token
        def mutate(self, info, **kwargs):
            user_roles = kwargs.get('user_roles')
            acronym = cleanse_input(kwargs.get('org'))
            domain = cleanse_input(kwargs.get('url'))

            # Check to see if org acronym is SA Org
            if acronym == 'SA':
                raise GraphQLError('Error, you cannot add a domain to this organization.')

            # Check to see if org exists
            org_orm = db_session.query(Organizations).filter(
                Organizations.acronym == acronym
            ).first()

            if org_orm is None:
                raise GraphQLError("Error, Organization does not exist.")
            org_id = org_orm.id

            # Check to see if domain exists
            domain_orm = db_session.query(Domains).filter(
                Domains.domain == domain
            ).first()

            if domain_orm is not None:
                raise GraphQLError("Error, Domain already exists.")

            if is_user_write(user_roles=user_roles, org_id=org_id):
                new_domain = Domains(
                    domain=domain,
                    organization_id=org_id
                )
                try:
                    db_session.add(new_domain)
                    db_session.commit()
                    return CreateDomain(status=True)
                except Exception as e:
                    db_session.rollback()
                    db_session.flush()
                    return CreateDomain(status=False)
            else:
                raise GraphQLError(
                    "Error, you do not have permission to create a domain for "
                    "that organization"
                )


class UpdateDomain(graphene.Mutation):
    """
    Mutation allows the modification of domains if domain is updated through
    out its life-cycle
    """

    class Arguments:
        current_url = URL(
            description="The current domain that is being requested to be "
                        "updated.",
            required=True
        )
        updated_url = URL(
            description="The new domain you wish to update the current domain "
                        "to be.",
            required=True
        )

    status = graphene.Boolean()

    with app.app_context():
        @require_token
        def mutate(self, info, **kwargs):
            user_roles = kwargs.get('user_roles')
            current_domain = cleanse_input(kwargs.get('current_url'))
            updated_domain = cleanse_input(kwargs.get('updated_url'))

            # Check to see if current domain exists
            domain_orm = Domains.query.filter(
                Domains.domain == current_domain
            ).first()

            if domain_orm is None:
                raise GraphQLError("Error, domain does not exist.")

            if is_user_write(user_roles=user_roles, org_id=domain_orm.organization_id):
                Domains.query.filter(
                    Domains.domain == current_domain
                ).update({'domain': updated_domain})

                try:
                    db_session.commit()
                    return UpdateDomain(status=True)
                except Exception as e:
                    db_session.rollback()
                    db_session.flush()
                    return UpdateDomain(status=False)
            else:
                raise GraphQLError(
                    "Error, you do not have permission to edit domains belonging to another organization"
                )


class RemoveDomain(graphene.Mutation):
    """
    This mutation allows the removal of unused domains
    """

    class Arguments:
        url = URL(
            description="URL of domain that is being removed",
            required=True
        )

    status = graphene.Boolean()

    with app.app_context():
        @require_token
        def mutate(self, info, **kwargs):
            user_roles = kwargs.get('user_roles')
            domain = cleanse_input(kwargs.get('url'))

            # Check to see if domain exists
            domain_orm = Domains.query.filter(
                Domains.domain == domain
            ).first()

            # Check to see if domain exists
            if domain_orm is None:
                raise GraphQLError("Error, domain does not exist.")

            # Check permissions
            if is_user_write(user_roles=user_roles, org_id=domain_orm.organization_id):
                try:
                    # Get Domain Id
                    domain_id = Domains.query.filter(
                        Domains.domain == domain
                    ).first().id

                    # Get All Scans
                    scans = db_session.query(Scans).filter(
                        Scans.domain_id == domain_id
                    ).all()

                    # Remove all related scans
                    for scan in scans:
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
                            Scans.query.filter(
                                Scans.id == scan.id
                            ).delete()
                        except Exception as e:
                            return RemoveDomain(status=False)

                    Domains.query.filter(
                        Domains.domain == domain
                    ).delete()
                    db_session.commit()
                    return RemoveDomain(status=True)

                except Exception as e:
                    db_session.rollback()
                    db_session.flush()
                    return RemoveDomain(status=False)
            else:
                raise GraphQLError(
                    "Error, you do not have permission to remove domains."
                )
