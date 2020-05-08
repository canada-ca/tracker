from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Domains(db.Model):
    __tablename__ = 'domains'

    id = db.Column(db.Integer, primary_key=True)
    domain = db.Column(db.String())
    last_run = db.Column(db.DateTime)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'))
    organization = db.relationship("Organizations", back_populates="domains", cascade="all, delete")
    scans = db.relationship("Scans", back_populates="domain", cascade="all, delete")
    dmarc_reports = db.relationship("Dmarc_Reports", back_populates="domain", cascade="all, delete")


class Organizations(db.Model):
    __tablename__ = 'organizations'

    id = db.Column(db.Integer, primary_key=True)
    acronym = db.Column(db.String())
    org_tags = db.Column(db.JSON)
    domains = db.relationship("Domains", back_populates="organization", cascade="all, delete")
    users = db.relationship("User_affiliations", back_populates="user_organization", cascade="all, delete")


class Users(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_name = db.Column(db.String())
    display_name = db.Column(db.String())
    user_password = db.Column(db.String())
    preferred_lang = db.Column(db.String())
    failed_login_attempts = db.Column(db.Integer, default=0)
    failed_login_attempt_time = db.Column(db.Float, default=0, nullable=True)
    tfa_validated = db.Column(db.Boolean, default=False)
    user_affiliation = db.relationship("User_affiliations", back_populates="user", cascade="all, delete")


class User_affiliations(db.Model):
    __tablename__ = 'user_affiliations'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'))
    permission = db.Column(db.String())
    user = db.relationship("Users", back_populates="user_affiliation", cascade="all, delete")
    user_organization = db.relationship("Organizations", back_populates="users", cascade="all, delete")


class Scans(db.Model):
    __tablename__ = 'scans'

    id = db.Column(db.Integer, primary_key=True)
    domain_id = db.Column(db.Integer, db.ForeignKey('domains.id'))
    scan_date = db.Column(db.DateTime)
    initiated_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    domain = db.relationship("Domains", back_populates="scans", cascade="all, delete")


class Dmarc_scans(db.Model):
    __tablename__ = 'dmarc_scans'

    id = db.Column(db.Integer, db.ForeignKey('scans.id'), primary_key=True)
    dmarc_phase = db.Column(db.Integer)
    dmarc_scan = db.Column(db.JSON)


class Dkim_scans(db.Model):
    __tablename__ = 'dkim_scans'

    id = db.Column(db.Integer, db.ForeignKey('scans.id'), primary_key=True)
    dkim_scan = db.Column(db.JSON)

class Mx_scans(db.Model):
    __tablename__ = 'mx_scans'

    id = db.Column(db.Integer, db.ForeignKey('scans.id'), primary_key=True)
    mx_scan = db.Column(db.JSON)

class Spf_scans(db.Model):
    __tablename__ = 'spf_scans'

    id = db.Column(db.Integer, db.ForeignKey('scans.id'), primary_key=True)
    spf_scan = db.Column(db.JSON)


class Https_scans(db.Model):
    __tablename__ = 'https_scans'

    id = db.Column(db.Integer, db.ForeignKey('scans.id'), primary_key=True)
    https_scan = db.Column(db.JSON)


class Ssl_scans(db.Model):
    __tablename__ = 'ssl_scans'

    id = db.Column(db.Integer, db.ForeignKey('scans.id'), primary_key=True)
    ssl_scan = db.Column(db.JSON)


class Ciphers(db.Model):
    __tablename__ = 'ciphers'

    id = db.Column(db.Integer, primary_key=True)
    cipher_type = db.Column(db.String())


class Guidance(db.Model):
    __tablename__ = 'guidance'

    id = db.Column(db.Integer, primary_key=True)
    tag_name = db.Column(db.String())
    guidance = db.Column(db.String())
    ref_links = db.Column(db.String())


class Classification(db.Model):
    __tablename__ = 'Classification'

    id = db.Column(db.Integer, primary_key=True)
    UNCLASSIFIED = db.Column(db.String())
