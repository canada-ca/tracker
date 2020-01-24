from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import Integer, DateTime
from sqlalchemy import Column, String

from ...models import base


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
    https = relationship("Https_scans", back_populates="https_flagged_scan" , cascade="all, delete")
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