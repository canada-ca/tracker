from sqlalchemy.types import Integer, Boolean, DateTime
from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB

from db_manager.manage import data_base


class Domains(data_base.Model):
    __tablename__ = 'domains'

    id = data_base.Column(Integer, primary_key=True)
    domain = data_base.Column(String)
    last_run = data_base.Column(DateTime)
    scan_spf = data_base.Column(Boolean)
    scan_dmarc = data_base.Column(Boolean)
    scan_dmarc_psl = data_base.Column(Boolean)
    scan_mx = data_base.Column(Boolean)
    scan_dkim = data_base.Column(Boolean)
    scan_https = data_base.Column(Boolean)
    scan_ssl = data_base.Column(Boolean)
    dmarc_phase = data_base.Column(Integer)
    organization_id = data_base.Column(Integer, ForeignKey('organizations.id'))
    organization = data_base.relationship("Organizations", back_populates="domains", cascade="all, delete")
    scans = data_base.relationship("Scans", back_populates="domain", cascade="all, delete")


class Organizations(data_base.Model):
    __tablename__ = 'organizations'

    id = data_base.Column(data_base.Integer, primary_key=True)
    organization = data_base.Column(String)
    description = data_base.Column(String)
    group_id = data_base.Column(Integer, ForeignKey('groups.id'))
    group = data_base.relationship("Groups", back_populates="organizations", cascade="all, delete")
    domains = data_base.relationship("Domains", back_populates="organization", cascade="all, delete")
    users = data_base.relationship("User_affiliations", back_populates="user_organization", cascade="all, delete")


class Groups(data_base.Model):
    __tablename__ = 'groups'

    id = data_base.Column(Integer, primary_key=True)
    s_group = data_base.Column(String)
    description = data_base.Column(String)
    sector_id = data_base.Column(Integer, ForeignKey('sectors.id'))
    organizations = data_base.relationship("Organizations", back_populates="group", cascade="all, delete")
    group_sector = data_base.relationship("Sectors", back_populates="groups", cascade="all, delete")


class Sectors(data_base.Model):
    __tablename__ = 'sectors'

    id = data_base.Column(Integer, primary_key=True)
    sector = data_base.Column(String)
    zone = data_base.Column(String)
    description = data_base.Column(String)
    groups = data_base.relationship("Groups", back_populates="group_sector", cascade="all, delete")
    affiliated_admins = data_base.relationship("Admin_affiliations", back_populates="admin_sector", cascade="all, delete")


class Admins(data_base.Model):
    __tablename__ = 'admins'

    id = data_base.Column(Integer, primary_key=True)
    username = data_base.Column(String)
    display_name = data_base.Column(String)
    user_email = data_base.Column(String)
    preferred_lang = data_base.Column(String)
    admin_affiliation = data_base.relationship("Admin_affiliations", back_populates="admin", cascade="all, delete")


class Admin_affiliations(data_base.Model):
    __tablename__ = 'admin_affiliations'

    id = data_base.Column(Integer, ForeignKey('admins.id'), primary_key=True)
    sector_id = data_base.Column(Integer, ForeignKey('sectors.id'))
    permission = data_base.Column(String)
    admin = data_base.relationship("Admins", back_populates="admin_affiliation", cascade="all, delete")
    admin_sector = data_base.relationship("Sectors", back_populates="affiliated_admins", cascade="all, delete")


class Users(data_base.Model):
    __tablename__ = 'users'

    id = data_base.Column(Integer, primary_key=True, autoincrement=True)
    username = data_base.Column(String)
    display_name = data_base.Column(String)
    user_email = data_base.Column(String)
    user_password = data_base.Column(String)
    preferred_lang = data_base.Column(String)
    failed_login_attempts = data_base.Column(Integer, default=0)
    user_affiliation = data_base.relationship("User_affiliations", back_populates="user", cascade="all, delete")


class User_affiliations(data_base.Model):
    __tablename__ = 'user_affiliations'

    id = data_base.Column(Integer, ForeignKey('users.id'), primary_key=True)
    organization_id = data_base.Column(Integer, ForeignKey('organizations.id'))
    permission = data_base.Column(String)
    user = data_base.relationship("Users", back_populates="user_affiliation", cascade="all, delete")
    user_organization = data_base.relationship("Organizations", back_populates="users", cascade="all, delete")


class Scans(data_base.Model):
    __tablename__ = 'scans'

    id = data_base.Column(Integer, primary_key=True)
    domain_id = data_base.Column(Integer, ForeignKey('domains.id'))
    scan_date = data_base.Column(DateTime)
    initiated_by = data_base.Column(String)
    domain = data_base.relationship("Domains", back_populates="scans", cascade="all, delete")
    dmarc = data_base.relationship("Dmarc_scans", back_populates="dmarc_flagged_scan", cascade="all, delete")
    dkim = data_base.relationship("Dkim_scans", back_populates="dkim_flagged_scan", cascade="all, delete")
    spf = data_base.relationship("Spf_scans", back_populates="spf_flagged_scan", cascade="all, delete")
    https = data_base.relationship("Https_scans", back_populates="https_flagged_scan", cascade="all, delete")
    ssl = data_base.relationship("Ssl_scans", back_populates="ssl_flagged_scan", cascade="all, delete")


class Dmarc_scans(data_base.Model):
    __tablename__ = 'dmarc_scans'

    id = data_base.Column(Integer, ForeignKey('scans.id'), primary_key=True)
    dmarc_scan = data_base.Column(JSONB)
    dmarc_flagged_scan = data_base.relationship("Scans", back_populates="dmarc", cascade="all, delete")


class Dkim_scans(data_base.Model):
    __tablename__ = 'dkim_scans'

    id = data_base.Column(Integer, ForeignKey('scans.id'), primary_key=True)
    dkim_scan = data_base.Column(JSONB)
    dkim_flagged_scan = data_base.relationship("Scans", back_populates="dkim", cascade="all, delete")


class Spf_scans(data_base.Model):
    __tablename__ = 'spf_scans'

    id = data_base.Column(Integer, ForeignKey('scans.id'), primary_key=True)
    spf_scan = data_base.Column(JSONB)
    spf_flagged_scan = data_base.relationship("Scans", back_populates="spf", cascade="all, delete")


class Https_scans(data_base.Model):
    __tablename__ = 'https_scans'

    id = data_base.Column(Integer, ForeignKey('scans.id'), primary_key=True)
    https_scan = data_base.Column(JSONB)
    https_flagged_scan = data_base.relationship("Scans", back_populates="https", cascade="all, delete")


class Ssl_scans(data_base.Model):
    __tablename__ = 'ssl_scans'

    id = data_base.Column(Integer, ForeignKey('scans.id'), primary_key=True)
    ssl_scan = data_base.Column(JSONB)
    ssl_flagged_scan = data_base.relationship("Scans", back_populates="ssl", cascade="all, delete")


class Ciphers(data_base.Model):

    id = data_base.Column(Integer, primary_key=True)
    cipher_type = data_base.Column(String)


class Guidance(data_base.Model):
    __tablename__ = 'guidance'

    id = data_base.Column(Integer, primary_key=True)
    tag_name = data_base.Column(String)
    guidance = data_base.Column(String)
    ref_links = data_base.Column(String)


class Classification(data_base.Model):
    __tablename__ = 'Classification'

    id = data_base.Column(Integer, primary_key=True)
    UNCLASSIFIED = data_base.Column(String)
