from sqlalchemy.types import Integer
from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from slugify import slugify
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from db import Base


class Organizations(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    slug = Column(String, index=True)
    acronym = Column(String)
    org_tags = Column(JSONB)
    domains = relationship("Domains", back_populates="organization", cascade="all, delete")
    users = relationship(
        "User_affiliations", back_populates="user_organization", passive_deletes=True
    )

    def __init__(self, **kwargs):
        super(Organizations, self).__init__(**kwargs)
        self.slug = slugify(kwargs.get("name", ""))
        if self.org_tags is None:
            self.org_tags = dict()
