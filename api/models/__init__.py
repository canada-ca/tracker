from graphene import Time
from sqlalchemy.types import Integer, Boolean, DateTime, Float
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from db import Base
from functions.slugify import slugify_value
from models.Users import Users
from models.User_affiliations import User_affiliations
from models.Organizations import Organizations


class Domains(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, autoincrement=True)
    domain = Column(String)
    last_run = Column(DateTime)
    selectors = Column(ARRAY(String))
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    slug = Column(String, index=True)
    organization = relationship(
        "Organizations", back_populates="domains", cascade="all, delete"
    )
    web_scans = relationship("Web_scans", back_populates="domain", cascade="all, delete")
    mail_scans = relationship("Mail_scans", back_populates="domain", cascade="all, delete")
    dmarc_reports = relationship(
        "Dmarc_Reports", back_populates="domain", cascade="all, delete"
    )

    def __init__(self, **kwargs):
        super(Domains, self).__init__(**kwargs)
        self.slug = slugify_value(kwargs.get("domain", ""))


class Dmarc_Reports(Base):
    __tablename__ = "dmarc_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    report = Column(JSONB)
    domain = relationship(
        "Domains", back_populates="dmarc_reports", cascade="all, delete"
    )


class Web_scans(Base):
    __tablename__ = "web_scans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    scan_date = Column(DateTime)
    initiated_by = Column(Integer, ForeignKey("users.id"))
    domain = relationship("Domains", back_populates="web_scans", cascade="all, delete")


class Mail_scans(Base):
    __tablename__ = "mail_scans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    scan_date = Column(DateTime)
    dmarc_phase = Column(Integer)
    selectors = Column(ARRAY(String))
    initiated_by = Column(Integer, ForeignKey("users.id"))
    domain = relationship("Domains", back_populates="mail_scans", cascade="all, delete")


class Dmarc_scans(Base):
    __tablename__ = "dmarc_scans"

    id = Column(Integer, ForeignKey("mail_scans.id"), primary_key=True)
    dmarc_scan = Column(JSONB)


class Dkim_scans(Base):
    __tablename__ = "dkim_scans"

    id = Column(Integer, ForeignKey("mail_scans.id"), primary_key=True)
    dkim_scan = Column(JSONB)


class Mx_scans(Base):
    __tablename__ = "mx_scans"

    id = Column(Integer, ForeignKey("mail_scans.id"), primary_key=True)
    mx_scan = Column(JSONB)


class Spf_scans(Base):
    __tablename__ = "spf_scans"

    id = Column(Integer, ForeignKey("mail_scans.id"), primary_key=True)
    spf_scan = Column(JSONB)


class Https_scans(Base):
    __tablename__ = "https_scans"

    id = Column(Integer, ForeignKey("web_scans.id"), primary_key=True)
    https_scan = Column(JSONB)


class Ssl_scans(Base):
    __tablename__ = "ssl_scans"

    id = Column(Integer, ForeignKey("web_scans.id"), primary_key=True)
    ssl_scan = Column(JSONB)


class Ciphers(Base):
    __tablename__ = "ciphers"

    id = Column(Integer, primary_key=True)
    cipher_type = Column(String)


class Guidance(Base):
    __tablename__ = "guidance"

    id = Column(Integer, primary_key=True)
    tag_name = Column(String)
    guidance = Column(String)
    ref_links = Column(String)


class Classification(Base):
    __tablename__ = "Classification"

    id = Column(Integer, primary_key=True)
    UNCLASSIFIED = Column(String)
