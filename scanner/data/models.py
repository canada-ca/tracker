from sqlalchemy import Table, Column, Integer, ForeignKey
from sqlalchemy.types import Integer, Boolean, DateTime
from sqlalchemy import create_engine
from sqlalchemy import Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSONB
import psycopg2
import logger

LOGGER = logger.get_logger(__name__)

base = declarative_base()

class Connection:

    def __init__(self, _user, _password, _host, _port, _db):
        try:
            self.engine = create_engine(f"postgresql+psycopg2://{_user}:{_password}@{_host}/{_db}", echo=True)

            base.metadata.create_all(bind=self.engine)
            Session = sessionmaker(bind=self.engine)
            self.session = Session()
            LOGGER.info("Connected to PostgreSQL")

            self.domains = Domains()
            self.organizations = Organizations()
            self.groups = Groups()
            self.sectors = Sectors()
            self.admins = Admins()
            self.admin_affiliations = Admin_affiliations()
            self.users = Users()
            self.user_affiliations = User_affiliations()
            self.scans = Scans()
            self.dmarc_scans = Dmarc_scans()
            self.dkim_scans = Dkim_scans()
            self.spf_scans = Spf_scans()
            self.https_scans =  Https_scans()
            self.ssl_scans = Ssl_scans()
            self.ciphers = Ciphers()
            self.guidance = Guidance()
            self.classification = Classification()

        except Exception as error:
            LOGGER.error(f"Error while connecting to PostgreSQL: {error}")


    def close(self):
        try:
            self.session.close()
            LOGGER.info("PostgreSQL connection is closed")

        except Exception as error:
            LOGGER.error(f"Error while closing PostgreSQL connection: {error}")


    def insert(self, _data):
        try:
            self.session.add(_data)

        except Exception as error:
            LOGGER.error(f"Error while inserting data: {error}")

    def insert_all(self, _data):
        try:
            self.session.add_all(_data)

        except Exception as error:
            LOGGER.error(f"Error while bulk inserting data: {error}")


    def commit(self):
        self.session.commit()


    def query(self, _query):
        return self.session.query(_query).all()


    def delete(self, _data):
        self.session.delete(_data)


class Domains(base):
    __tablename__ = 'domains'

    id = Column(Integer, primary_key=True)
    domain = Column(String)
    last_run = Column(DateTime)
    scan_spf = Column(Boolean)
    scan_dmarc = Column(Boolean)
    scan_dmarc_psl = Column(Boolean)
    scan_mx = Column(Boolean)
    scan_dkim = Column(Boolean)
    scan_https = Column(Boolean)
    scan_ssl = Column(Boolean)
    dmarc_phase = Column(Integer)
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    organization = relationship("Organizations", back_populates="domains", cascade="all, delete")
    scans = relationship("Scans", back_populates="domain", cascade="all, delete")


class Organizations(base):
    __tablename__ = 'organizations'

    id = Column(Integer, primary_key=True)
    organization = Column(String)
    description = Column(String)
    group_id = Column(Integer, ForeignKey('groups.id'))
    group = relationship("Groups", back_populates="organizations", cascade="all, delete")
    domains = relationship("Domains", back_populates="organization", cascade="all, delete")
    users = relationship("User_affiliations", back_populates="user_organization", cascade="all, delete")

class Groups(base):
    __tablename__ = 'groups'

    id = Column(Integer, primary_key=True)
    s_group = Column(String)
    description = Column(String)
    sector_id = Column(Integer, ForeignKey('sectors.id'))
    organizations = relationship("Organizations", back_populates="group", cascade="all, delete")
    group_sector = relationship("Sectors", back_populates="groups", cascade="all, delete")

class Sectors(base):
    __tablename__ = 'sectors'

    id = Column(Integer, primary_key=True)
    sector = Column(String)
    zone = Column(String)
    description = Column(String)
    groups = relationship("Groups", back_populates="group_sector", cascade="all, delete")
    affiliated_admins = relationship("Admin_affiliations", back_populates="admin_sector", cascade="all, delete")

class Admins(base):
    __tablename__ = 'admins'

    id = Column(Integer, primary_key=True)
    username = Column(String)
    display_name = Column(String)
    user_email = Column(String)
    preferred_lang = Column(String)
    admin_affiliation = relationship("Admin_affiliations", back_populates="admin", cascade="all, delete")

class Admin_affiliations(base):
    __tablename__ = 'admin_affiliations'

    id = Column(Integer, ForeignKey('admins.id'), primary_key=True)
    sector_id = Column(Integer, ForeignKey('sectors.id'))
    permission = Column(String)
    admin = relationship("Admins", back_populates="admin_affiliation", cascade="all, delete")
    admin_sector = relationship("Sectors", back_populates="affiliated_admins", cascade="all, delete")

class Users(base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String)
    display_name = Column(String)
    user_email = Column(String)
    preferred_lang = Column(String)
    user_affiliation = relationship("User_affiliations", back_populates="user", cascade="all, delete")

class User_affiliations(base):
    __tablename__ = 'user_affiliations'

    id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    permission = Column(String)
    user = relationship("Users", back_populates="user_affiliation", cascade="all, delete")
    user_organization = relationship("Organizations", back_populates="users", cascade="all, delete")

class Scans(base):
    __tablename__ = 'scans'

    id = Column(Integer, primary_key=True)
    domain_id = Column(Integer, ForeignKey('domains.id'))
    scan_date = Column(DateTime)
    initiated_by = Column(String)
    domain = relationship("Domains", back_populates="scans", cascade="all, delete")
    dmarc = relationship("Dmarc_scans", back_populates="dmarc_flagged_scan", cascade="all, delete")
    dkim = relationship("Dkim_scans", back_populates="dkim_flagged_scan", cascade="all, delete")
    spf = relationship("Spf_scans", back_populates="spf_flagged_scan", cascade="all, delete")
    https = relationship("Https_scans", back_populates="https_flagged_scan", cascade="all, delete")
    ssl = relationship("Ssl_scans", back_populates="ssl_flagged_scan", cascade="all, delete")

class Dmarc_scans(base):
    __tablename__ = 'dmarc_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    dmarc_scan = Column(JSONB)
    dmarc_flagged_scan = relationship("Scans", back_populates="dmarc", cascade="all, delete")

class Dkim_scans(base):
    __tablename__ = 'dkim_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    dkim_scan = Column(JSONB)
    dkim_flagged_scan = relationship("Scans", back_populates="dkim", cascade="all, delete")

class Spf_scans(base):
    __tablename__ = 'spf_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    spf_scan = Column(JSONB)
    spf_flagged_scan = relationship("Scans", back_populates="spf", cascade="all, delete")

class Https_scans(base):
    __tablename__ = 'https_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    https_scan = Column(JSONB)
    https_flagged_scan = relationship("Scans", back_populates="https", cascade="all, delete")

class Ssl_scans(base):
    __tablename__ = 'ssl_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    ssl_scan = Column(JSONB)
    ssl_flagged_scan = relationship("Scans", back_populates="ssl", cascade="all, delete")

class Ciphers(base):
    __tablename__ = 'ciphers'
    id = Column(Integer, primary_key=True)
    cipher_type = Column(String)

class Guidance(base):
    __tablename__ = 'guidance'

    id = Column(Integer, primary_key=True)
    tag_name = Column(String)
    guidance = Column(String)
    ref_links = Column(String)

class Classification(base):
    __tablename__ = 'Classification'

    id = Column(Integer, primary_key=True)
    UNCLASSIFIED = Column(String)
