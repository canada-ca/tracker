from graphene import Time
from sqlalchemy.types import Integer, Boolean, DateTime, Float
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from db import Base


class Domains(Base):
    __tablename__ = 'domains'

    id = Column(Integer, primary_key=True)
    domain = Column(String)
    last_run = Column(DateTime)
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    organization = relationship("Organizations", back_populates="domains", cascade="all, delete")
    scans = relationship("Scans", back_populates="domain", cascade="all, delete")
    dmarc_reports = relationship("Dmarc_Reports", back_populates="domain", cascade="all, delete")


class Organizations(Base):
    __tablename__ = 'organizations'

    id = Column(Integer, primary_key=True)
    acronym = Column(String)
    org_tags = Column(JSONB)
    domains = relationship("Domains", back_populates="organization", cascade="all, delete")
    users = relationship("User_affiliations", back_populates="user_organization", cascade="all, delete")


class Users(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_name = Column(String)
    display_name = Column(String)
    user_password = Column(String)
    preferred_lang = Column(String)
    failed_login_attempts = Column(Integer, default=0)
    failed_login_attempt_time = Column(Float, default=0, nullable=True)
    tfa_validated = Column(Boolean, default=False)
    user_affiliation = relationship("User_affiliations", back_populates="user", cascade="all, delete")


class User_affiliations(Base):
    __tablename__ = 'user_affiliations'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    permission = Column(String)
    user = relationship("Users", back_populates="user_affiliation", cascade="all, delete")
    user_organization = relationship("Organizations", back_populates="users", cascade="all, delete")


class Dmarc_Reports(Base):
    __tablename__ = 'dmarc_reports'

    id = Column(Integer, primary_key=True, autoincrement=True)
    domain_id = Column(Integer, ForeignKey('domains.id'))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    report = Column(JSONB)
    domain = relationship("Domains", back_populates="dmarc_reports", cascade="all, delete")


class Scans(Base):
    __tablename__ = 'scans'

    id = Column(Integer, primary_key=True)
    domain_id = Column(Integer, ForeignKey('domains.id'))
    scan_date = Column(DateTime)
    initiated_by = Column(Integer, ForeignKey('users.id'))
    domain = relationship("Domains", back_populates="scans", cascade="all, delete")


class Dmarc_scans(Base):
    __tablename__ = 'dmarc_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    dmarc_phase = Column(Integer)
    dmarc_scan = Column(JSONB)


class Dkim_scans(Base):
    __tablename__ = 'dkim_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    dkim_scan = Column(JSONB)

class Mx_scans(Base):
    __tablename__ = 'mx_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    mx_scan = Column(JSONB)

class Spf_scans(Base):
    __tablename__ = 'spf_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    spf_scan = Column(JSONB)


class Https_scans(Base):
    __tablename__ = 'https_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    https_scan = Column(JSONB)


class Ssl_scans(Base):
    __tablename__ = 'ssl_scans'

    id = Column(Integer, ForeignKey('scans.id'), primary_key=True)
    ssl_scan = Column(JSONB)


class Ciphers(Base):
    __tablename__ = 'ciphers'

    id = Column(Integer, primary_key=True)
    cipher_type = Column(String)


class Guidance(Base):
    __tablename__ = 'guidance'

    id = Column(Integer, primary_key=True)
    tag_name = Column(String)
    guidance = Column(String)
    ref_links = Column(String)


class Classification(Base):
    __tablename__ = 'Classification'

    id = Column(Integer, primary_key=True)
    UNCLASSIFIED = Column(String)
