from sqlalchemy.types import Integer
from sqlalchemy import Column, String, select, func
from sqlalchemy.orm import relationship, column_property
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method

from functions.slugify import slugify_value
from db import Base
from models.Domains import Domains


class Organizations(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    slug = Column(String, index=True)
    acronym = Column(String)
    org_tags = Column(JSONB)
    domain_count = column_property(
        select([func.count(Domains.id)])
        .where(Domains.organization_id == id)
        .correlate_except(Domains)
    )
    domains = relationship(
        "Domains", back_populates="organization", cascade="all, delete"
    )
    users = relationship(
        "User_affiliations", back_populates="user_organization", passive_deletes=True
    )

    def __init__(self, **kwargs):
        super(Organizations, self).__init__(**kwargs)
        self.slug = slugify_value(kwargs.get("name", ""))
        if self.org_tags is None:
            self.org_tags = dict()
