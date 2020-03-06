import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from app import app
from models import Scans, Ssl_scans, Https_scans

from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp
