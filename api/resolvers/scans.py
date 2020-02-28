from graphql import GraphQLError
from sqlalchemy.orm import load_only
import sqlalchemy as sq
from sqlalchemy import between

from app import app

from schemas.scans import (
    Scans,
    ScanModel
)

from schemas.domains import (
    Domains,
    DomainModel
)

from schemas.user import (
    User as UserModel,
    UserObject as User
)


# Resolvers
def resolve_get_scan_by_id(self, info, **kwargs):
    """Return a scan by its ID"""
    scan_id = kwargs.get('id')
    with app.app_context():
        query = Scans.get_query(info).filter(
            ScanModel.id == scan_id
        )
    if not len(query.all()):
        raise GraphQLError("Error, Invalid ID")
    return query.all()


def resolve_get_scans_by_date(self, info, **kwargs):
    """Return a list of scans on a certain date"""
    date = kwargs.get('date')
    with app.app_context():
        query = Scans.get_query(info).filter(
            sq.func.date_trunc('day', ScanModel.scan_date) == date
        )
    if not len(query.all()):
        raise GraphQLError("Error, No scans occurred on that date")
    return query.all()


def resolve_get_scans_by_date_range(self, info, **kwargs):
    """Return a list of scans from a date range"""
    start_date = kwargs.get('startDate')
    end_date = kwargs.get('endDate')
    with app.app_context():
        query = Scans.get_query(info).filter(
            sq.func.date_trunc('day', ScanModel.scan_date) >= start_date
        ).filter(
            sq.func.date_trunc('day', ScanModel.scan_date) <= end_date
        )
    if not len(query.all()):
        raise GraphQLError("Error, No scans in that date range")
    return query.all()


def resolve_get_scans_by_domain(self, info, **kwargs):
    """Return a list of scans based on a domain id"""
    domain = kwargs.get('url')
    with app.app_context():
        domain_id = Domains.get_query(info).filter(
            DomainModel.domain == domain
        ).options(load_only('id'))

    if not len(domain_id.all()):
        raise GraphQLError("Error, no domain associated with that URL")
    with app.app_context():
        query = Scans.get_query(info).filter(
            ScanModel.domain_id == domain_id
        )

    if not len(query.all()):
        raise GraphQLError("Error, no scans associated with that domain")
    return query.all()


def resolve_get_scans_by_user_id(self, info, **kwargs):
    """Return a list of scans based on a user id"""
    user = kwargs.get('id')
    with app.app_context():
        user_id = User.get_query(info).filter(
            UserModel.id == user
        ).options(load_only('id'))

    if not len(user_id.all()):
        raise GraphQLError("Error, cannot find user")
    with app.app_context():
        query = Scans.get_query(info).filter(
            ScanModel.initiated_by == user_id
        )

    if not len(query.all()):
        raise GraphQLError("Error, no scans initiated by that user")
    return query.all()
