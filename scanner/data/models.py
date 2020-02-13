from sqlalchemy import Table, Column, Integer, ForeignKey, inspect, create_engine, String
from sqlalchemy_utils import database_exists, create_database
from sqlalchemy.types import Integer, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSONB
import psycopg2
import logger

LOGGER = logger.get_logger(__name__)

db_tables = ['domains', 'organizations', 'groups', 'sectors', 'admins', 'admin_affiliations', 'users',
            'user_affiliations', 'scans', 'dmarc_scans', 'dkim_scans', 'spf_scans', 'https_scans',
             'ssl_scans', 'ciphers', 'guidance', 'Classification']

Base = declarative_base()

class Connection:

    def __init__(self, _user, _password, _host, _port, _db):
        try:
            self.engine = create_engine(f"postgresql+psycopg2://{_user}:{_password}@{_host}/{_db}", echo=True)

            _session = sessionmaker(bind=self.engine)
            self.session = _session()
            LOGGER.info("Connected to PostgreSQL")

        except Exception as error:
            LOGGER.error(f"Error while connecting to PostgreSQL: {error}")


    def test_connection(self):
        try:
            res = self.engine.execute("select 1 as is_alive")
            res.close()
            return True
        except Exception:
            return False

    def test_schema(self):
        inspector = inspect(self.engine)
        for table in db_tables:
            if table not in inspector.get_table_names():
                LOGGER.error('Error: missing table(s) from the database')
                return False
        return True

    def exists(self):
        if not database_exists(self.engine.url):
            return False
        else:
            return True

    def create(self):
        try:
            #self.base.metadata.create_all(bind=self.engine, checkfirst=True)
            if not database_exists(self.engine.url):
                create_database(self.engine.url)
                Base.metadata.create_all(self.engine)
                self._commit()
            else:
                raise Exception("Database already exists")

            LOGGER.info("PostgreSQL database successfully created")

        except Exception as err:
            LOGGER.error("Error while creating PostreSQL database: %s" % err)

    def close(self):
        try:
            self.session.close()
            LOGGER.info("PostgreSQL connection is closed")

        except Exception as err:
            LOGGER.error("Error while closing PostreSQL connection: %s" % err)

    def insert(self, _table, _data):
        try:
            row = _table.construct(_data)
            self.session.add(row)
            self._commit()
        except Exception as err:
            LOGGER.error("Error while inserting data: %s" % err)

    def insert_all(self, _table, _data):
        try:
            for row in _data:
                self.session.add(_table.construct(row))
            self._commit()
        except Exception as err:
            LOGGER.error("Error while bulk inserting data: %s" % err)

    def _commit(self):
        self.session.commit()

    def get(self, _table, *_filter):
        try:
            return self.session.query(_table).filter(*_filter).all()
        except Exception as e:
            LOGGER.error("Error querying database: %s" % str(e))

    def all(self, _table):
        return self.session.query(_table).all()

    def delete(self, _table, *_filter):
        try:
            q = self.session.query(_table).filter(*_filter)
            q.delete()
            self._commit()
        except Exception as e:
            LOGGER.error("Error deleting rows: %s" % str(e))

    def delete_all(self, _table):
        try:
            q = self.session.query(_table)
            q.delete()
            self._commit()
        except Exception as e:
            LOGGER.error("Error deleting contents of table: %s" % str(e))

    def get_all(self, _table):
        return self.session.query(_table).all()

    def update(self, _table, _update, *_filter):
        try:
            q = self.session.query(_table).filter(*_filter)
            q.update(_update)
            self._commit()
        except Exception as e:
            LOGGER.error("Error updating rows: %s" % str(e))


class Domains(Base):
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

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 11:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Domains(domain=_data["domain"],last_run=_data["last_run"],
                         scan_spf=_data["scan_spf"],scan_dmarc=_data["scan_dmarc"],
                          scan_dmarc_psl=_data["scan_dmarc_psl"],scan_mx=_data["scan_mx"],
                          scan_dkim=_data["scan_dkim"],scan_https=_data["scan_https"],
                          scan_ssl=_data["scan_ssl"],dmarc_phase=_data["dmarc_phase"],
                          organization_id=_data["organization_id"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Domain' object(s): %s" % err)


class Organizations(Base):
    __tablename__ = 'organizations'

    id = Column(Integer, primary_key=True)
    organization = Column(String)
    description = Column(String)
    group_id = Column(Integer, ForeignKey('groups.id'))
    group = relationship("Groups", back_populates="organizations", cascade="all, delete")
    domains = relationship("Domains", back_populates="organization", cascade="all, delete")
    users = relationship("User_affiliations", back_populates="user_organization", cascade="all, delete")

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 3:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Organizations(organization=_data["organization"],description=_data["description"],
                         group_id=_data["group_id"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Organization' object(s): %s" % err)

class Groups(Base):
    __tablename__ = 'groups'

    id = Column(Integer, primary_key=True)
    s_group = Column(String)
    description = Column(String)
    sector_id = Column(Integer, ForeignKey('sectors.id'))
    organizations = relationship("Organizations", back_populates="group", cascade="all, delete")
    group_sector = relationship("Sectors", back_populates="groups", cascade="all, delete")

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 3:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Groups(s_group=_data["s_group"],description=_data["description"],
                         sector_id=_data["sector_id"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Group' object(s): %s" % err)

class Sectors(Base):
    __tablename__ = 'sectors'

    id = Column(Integer, primary_key=True)
    sector = Column(String)
    zone = Column(String)
    description = Column(String)
    groups = relationship("Groups", back_populates="group_sector", cascade="all, delete")
    affiliated_admins = relationship("Admin_affiliations", back_populates="admin_sector", cascade="all, delete")

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 3:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Sectors(sector=_data["sector"],zone=_data["zone"],
                          description=_data["description"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Sector' object(s): %s" % err)

class Admins(Base):
    __tablename__ = 'admins'

    id = Column(Integer, primary_key=True)
    username = Column(String)
    display_name = Column(String)
    user_email = Column(String)
    preferred_lang = Column(String)
    admin_affiliation = relationship("Admin_affiliations", back_populates="admin", cascade="all, delete")

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 4:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Admins(username=_data["username"],display_name=_data["display_name"],
                          user_email=_data["user_email"],preferred_lang=_data["preferred_lang"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Admin' object(s): %s" % err)

class Admin_affiliations(Base):
    __tablename__ = 'admin_affiliations'

    id = Column(Integer, ForeignKey('admins.id'), primary_key=True)
    sector_id = Column(Integer, ForeignKey('sectors.id'))
    permission = Column(String)
    admin = relationship("Admins", back_populates="admin_affiliation", cascade="all, delete")
    admin_sector = relationship("Sectors", back_populates="affiliated_admins", cascade="all, delete")

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 2:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Admin_affiliations(sector_id=_data["sector_id"],permission=_data["permission"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Admin_affiliation' object(s): %s" % err)

class Users(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String)
    display_name = Column(String)
    user_email = Column(String)
    preferred_lang = Column(String)
    user_affiliation = relationship("User_affiliations", back_populates="user", cascade="all, delete")

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 4:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Users(username=_data["username"],display_name=_data["display_name"],
                          user_email=_data["user_email"],preferred_lang=_data["preferred_lang"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'User' object(s): %s" % err)

class User_affiliations(Base):
    __tablename__ = 'user_affiliations'

    id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    permission = Column(String)
    user = relationship("Users", back_populates="user_affiliation", cascade="all, delete")
    user_organization = relationship("Organizations", back_populates="users", cascade="all, delete")

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 2:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = User_affiliations(organization_id=_data["organization_id"],permission=_data["permission"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'User_affiliation' object(s): %s" % err)

class Scans(Base):
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

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 3:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Scans(domain_id=_data["domain_id"],scan_date=_data["scan_date"],initiated_by=_data["initiated_by"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Scan' object(s): %s" % err)

class Dmarc_scans(Base):
    __tablename__ = 'dmarc_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    dmarc_scan = Column(JSONB)
    dmarc_flagged_scan = relationship("Scans", back_populates="dmarc", cascade="all, delete")

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 1:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Dmarc_scans(dmarc_scan=_data["dmarc_scan"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Dmarc_scan' object(s): %s" % err)

class Dkim_scans(Base):
    __tablename__ = 'dkim_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    dkim_scan = Column(JSONB)
    dkim_flagged_scan = relationship("Scans", back_populates="dkim", cascade="all, delete")

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 1:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Dkim_scans(dkim_scan=_data["dkim_scan"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Dkim_scan' object(s): %s" % err)

class Spf_scans(Base):
    __tablename__ = 'spf_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    spf_scan = Column(JSONB)
    spf_flagged_scan = relationship("Scans", back_populates="spf", cascade="all, delete")

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 1:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Spf_scans(spf_scan=_data["spf_scan"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Spf_scan' object(s): %s" % err)

class Https_scans(Base):
    __tablename__ = 'https_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    https_scan = Column(JSONB)
    https_flagged_scan = relationship("Scans", back_populates="https", cascade="all, delete")

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 1:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Https_scans(https_scan=_data["https_scan"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Https_scan' object(s): %s" % err)

class Ssl_scans(Base):
    __tablename__ = 'ssl_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    ssl_scan = Column(JSONB)
    ssl_flagged_scan = relationship("Scans", back_populates="ssl", cascade="all, delete")

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 1:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Ssl_scans(ssl_scan=_data["ssl_scan"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Ssl_scan' object(s): %s" % err)

class Ciphers(Base):
    __tablename__ = 'ciphers'
    id = Column(Integer, primary_key=True)
    cipher_type = Column(String)

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 1:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Ciphers(cipher_type=_data["cipher_type"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Cipher' object(s): %s" % err)

class Guidance(Base):
    __tablename__ = 'guidance'

    id = Column(Integer, primary_key=True)
    tag_name = Column(String)
    guidance = Column(String)
    ref_links = Column(String)

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 1:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Guidance(tag_name=_data["tag_name"],guidance=_data["guidance"],ref_links=_data["ref_links"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Guidance' object(s): %s" % err)

class Classification(Base):
    __tablename__ = 'Classification'

    id = Column(Integer, primary_key=True)
    UNCLASSIFIED = Column(String)

    @staticmethod
    def construct(_data):
        try:
            if len(_data) != 1:
                raise Exception("Invalid row length (%s)" % len(_data))

            row = Classification(UNCLASSIFIED=_data["UNCLASSIFIED"])

            return row

        except Exception as err:
            LOGGER.error("Error while creating 'Classification' object(s): %s" % err)
