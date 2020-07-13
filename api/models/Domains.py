from sqlalchemy.types import Integer, Boolean, DateTime, Float
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY

from db import Base
from functions.slugify import slugify_value


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
    web_scans = relationship(
        "Web_scans", back_populates="domain", cascade="all, delete"
    )
    mail_scans = relationship(
        "Mail_scans", back_populates="domain", cascade="all, delete"
    )

    def __init__(self, **kwargs):
        super(Domains, self).__init__(**kwargs)
        self.slug = slugify_value(kwargs.get("domain", ""))
