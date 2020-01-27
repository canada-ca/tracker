import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import (scoped_session, sessionmaker, relationship, backref)
import psycopg2

DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_NAME = os.getenv('DB_NAME')

engine = create_engine(f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}", echo=True)
base = declarative_base()
base.metadata.create_all(engine)
session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db_session = scoped_session(session_factory)

base.query = db_session.query_property()

from .types.User.userModel import *
from .types.Domains.domainsModel import *
from .types.Groups.groupsModel import *
from .types.Organizations.organizationsModel import *
from .types.Scans.scansModel import *
from .types.Sectors.sectorsModel import *
from .types.User.userModel import *
