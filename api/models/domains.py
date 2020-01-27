from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from sqlalchemy.types import Integer, Boolean, DateTime
from sqlalchemy import Column, String

from models import Base


class Domains(Base):
    __tablename__ = 'domains'
    __table_args__ = {'extend_existing': True}

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
    organization_id = Column(Integer, ForeignKey('Organizations.id'))
    organization = relationship("Organizations", back_populates="domains", cascade="all, delete")
    scans = relationship("Scans", back_populates="domain", cascade="all, delete")
