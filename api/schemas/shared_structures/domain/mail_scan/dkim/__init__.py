import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from db import db_session
from models import Dkim_scans, Domains, Mail_scans
from scalars.url import URL
from schemas.shared_structures.domain.mail_scan.dkim.selectors import DkimSelectors


class DKIM(SQLAlchemyObjectType):
    """
    DomainKeys Identified Mail (DKIM) permits a person, role, or
    organization that owns the signing domain to claim some
    responsibility for a message by associating the domain with the
    message.  This can be an author's organization, an operational relay,
    or one of their agents.
    """

    class Meta:
        model = Dkim_scans
        exclude_fields = ("id", "dkim_scan")

    id = graphene.ID(description="ID of the object.")
    domain = URL(description="The domain the scan was run on.")
    timestamp = graphene.DateTime(description="Time when scan was initiated.")
    selectors = graphene.List(
        lambda: DkimSelectors, description="Various dkim selectors used on this domain."
    )

    def resolve_domain(self: Dkim_scans, info, **kwargs):
        mail_scan_domain_id = (
            db_session.query(Mail_scans)
            .filter(Mail_scans.id == self.id)
            .first()
            .domain_id
        )
        domain = (
            db_session.query(Domains)
            .filter(Domains.id == mail_scan_domain_id)
            .first()
            .domain
        )
        return domain

    def resolve_timestamp(self: Dkim_scans, info, **kwargs):
        scan_date = (
            db_session.query(Mail_scans)
            .filter(Mail_scans.id == self.id)
            .first()
            .scan_date
        )
        return scan_date

    def resolve_selectors(self: Dkim_scans, info, **kwargs):
        rtr_list = []
        dkim_record = self.dkim_scan.get("dkim", None)

        if dkim_record is not None:
            missing_check = dkim_record.get("missing")

            if missing_check is True:
                rtr_list.append(
                    DkimSelectors(
                        selector=None,
                        record=None,
                        key_length=None,
                        dkim_guidance_tags={"missing": True},
                    )
                )
            else:
                for k, v in dkim_record.items():
                    rtr_list.append(
                        DkimSelectors(
                            selector=k, record=v, key_length=v, dkim_guidance_tags=v,
                        )
                    )
        return rtr_list
