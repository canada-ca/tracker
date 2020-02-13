from sqlalchemy.types import Integer, Boolean, DateTime
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from db import db


class Domains(db.Model):
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


class Organizations(db.Model):
    __tablename__ = 'organizations'

    id = Column(Integer, primary_key=True)
    organization = Column(String)
    description = Column(String)
    group_id = Column(Integer, ForeignKey('groups.id'))
    group = relationship("Groups", back_populates="organizations", cascade="all, delete")
    domains = relationship("Domains", back_populates="organization", cascade="all, delete")
    users = relationship("User_affiliations", back_populates="user_organization", cascade="all, delete")


class Groups(db.Model):
    __tablename__ = 'groups'

    id = Column(Integer, primary_key=True)
    s_group = Column(String)
    description = Column(String)
    sector_id = Column(Integer, ForeignKey('sectors.id'))
    organizations = relationship("Organizations", back_populates="group", cascade="all, delete")
    group_sector = relationship("Sectors", back_populates="groups", cascade="all, delete")


class Sectors(db.Model):
    __tablename__ = 'sectors'

    id = Column(Integer, primary_key=True)
    sector = Column(String)
    zone = Column(String)
    description = Column(String)
    groups = relationship("Groups", back_populates="group_sector", cascade="all, delete")
    affiliated_admins = relationship("Admin_affiliations", back_populates="admin_sector", cascade="all, delete")


class Admins(db.Model):
    __tablename__ = 'admins'

    id = Column(Integer, primary_key=True)
    username = Column(String)
    display_name = Column(String)
    user_email = Column(String)
    preferred_lang = Column(String)
    admin_affiliation = relationship("Admin_affiliations", back_populates="admin", cascade="all, delete")


class Admin_affiliations(db.Model):
    __tablename__ = 'admin_affiliations'

    id = Column(Integer, ForeignKey('admins.id'), primary_key=True)
    sector_id = Column(Integer, ForeignKey('sectors.id'))
    permission = Column(String)
    admin = relationship("Admins", back_populates="admin_affiliation", cascade="all, delete")
    admin_sector = relationship("Sectors", back_populates="affiliated_admins", cascade="all, delete")


class Users(db.Model):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String)
    display_name = Column(String)
    user_email = Column(String)
    user_password = Column(String)
    preferred_lang = Column(String)
    failed_login_attempts = Column(Integer, default=0)
    two_factor_auth = Column(Boolean, default=False)
    user_affiliation = relationship("User_affiliations", back_populates="user", cascade="all, delete")


class User_affiliations(db.Model):
    __tablename__ = 'user_affiliations'

    id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    permission = Column(String)
    user = relationship("Users", back_populates="user_affiliation", cascade="all, delete")
    user_organization = relationship("Organizations", back_populates="users", cascade="all, delete")


class Scans(db.Model):
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


class Dmarc_scans(db.Model):
    __tablename__ = 'dmarc_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    dmarc_scan = Column(JSONB)
    dmarc_flagged_scan = relationship("Scans", back_populates="dmarc", cascade="all, delete")


class Dkim_scans(db.Model):
    __tablename__ = 'dkim_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    dkim_scan = Column(JSONB)
    dkim_flagged_scan = relationship("Scans", back_populates="dkim", cascade="all, delete")


class Spf_scans(db.Model):
    __tablename__ = 'spf_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    spf_scan = Column(JSONB)
    spf_flagged_scan = relationship("Scans", back_populates="spf", cascade="all, delete")


class Https_scans(db.Model):
    __tablename__ = 'https_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    https_scan = Column(JSONB)
    https_flagged_scan = relationship("Scans", back_populates="https", cascade="all, delete")


class Ssl_scans(db.Model):
    __tablename__ = 'ssl_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    ssl_scan = Column(JSONB)
    ssl_flagged_scan = relationship("Scans", back_populates="ssl", cascade="all, delete")


class Ciphers(db.Model):
    __tablename__ = 'ciphers'

    id = Column(Integer, primary_key=True)
    cipher_type = Column(String)


class Guidance(db.Model):
    __tablename__ = 'guidance'

    id = Column(Integer, primary_key=True)
    tag_name = Column(String)
    guidance = Column(String)
    ref_links = Column(String)


class Classification(db.Model):
    __tablename__ = 'Classification'

    id = Column(Integer, primary_key=True)
    UNCLASSIFIED = Column(String)
