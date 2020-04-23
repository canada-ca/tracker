from graphql import GraphQLError
from flask_bcrypt import Bcrypt
from flask import current_app as app

from functions.input_validators import *
from functions.error_messages import *

from models import Organizations
from db import db_session


def create_organization(acronym):
    return acronym

