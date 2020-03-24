from graphql import GraphQLError
from sqlalchemy.orm import load_only

from app import app
from db import db

from functions.auth_wrappers import require_token
from functions.auth_functions import is_super_admin, is_user_read

from models import Domains, Dmarc_Reports

from schemas.dmarc_report import DmarcReport


@require_token
def resolve_dmarc_reports(self: DmarcReport, info, **kwargs):
    """
    
    :param self:
    :param info:
    :param kwargs:
    :return:
    """
