import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Dkim_scans
from scalars.url import URL
from functions.get_domain import get_domain
from functions.get_timestamp import get_timestamp


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

    id = graphene.ID(description="ID of the object")
    domain = URL(description="The domain the scan was run on")
    timestamp = graphene.DateTime(description="Time when scan was initiated")
    record = graphene.String(
        description="DKIM record retrieved during the scan of the " "given domain "
    )
    key_length = graphene.String(description="Length of DKIM public key")
    dkim_guidance_tags = graphene.List(
        lambda: graphene.String, description="Key tags found during scan"
    )

    def resolve_domain(self, info, **kwargs):
        get_domain(self, info)

    def resolve_timestamp(self, info, **kwargs):
        get_timestamp(self, info)

    def resolve_record(self, info, **kwargs):
        record = self.dkim_scan.get("dkim", {}).get("txt_record", None)
        return record

    def resolve_key_length(self, info, **kwargs):
        key_length = self.dkim_scan.get("dkim", {}).get("key_size", None)
        return key_length

    def resolve_dkim_guidance_tags(self, info, **kwargs):
        tags = []

        if self.dkim_scan.get("dkim", {}).get("missing", None) is not None:
            tags.append("dkim2")
            return tags

        # Get Key Size, and Key Type
        key_size = self.dkim_scan.get("dkim", {}).get("key_size", None)
        key_type = self.dkim_scan.get("dkim", {}).get("key_type", None)

        if key_size is None:
            tags.append("dkim9")
        elif key_type is None:
            tags.append("dkim9")
        else:
            if key_size >= 4096 and key_type == "rsa":
                tags.append("dkim8")
            elif key_size >= 2048 and key_type == "rsa":
                tags.append("dkim7")
            elif key_size == 1024 and key_type == "rsa":
                tags.append("dkim6")
            elif key_size < 1024 and key_type == "rsa":
                tags.append("dkim5")
            else:
                tags.append("dkim9")

        # Update Recommended
        key_invalid = self.dkim_scan.get("dkim", {}).get("update-recommend", None)

        if key_invalid is not None:
            if key_invalid is True:
                tags.append("dkim10")

        # Invalid Crypto
        invalid_crypto = (
            self.dkim_scan.get("dkim", {}).get("txt_record", {}).get("k", None)
        )

        if invalid_crypto is not None:
            # if k != rsa
            if invalid_crypto != "rsa":
                tags.append("dkim11")

        # Dkim value invalid
        # Check if v, k, and p exist in txt_record
        v_tag = self.dkim_scan.get("dkim", {}).get("txt_record", {}).get("v", None)
        k_tag = self.dkim_scan.get("dkim", {}).get("txt_record", {}).get("k", None)
        p_tag = self.dkim_scan.get("dkim", {}).get("txt_record", {}).get("p", None)

        if v_tag is None and k_tag is None and p_tag is None:
            if "dkim12" not in tags:
                tags.append("dkim12")

        # Testing Enabled
        t_enabled = self.dkim_scan.get("dkim", {}).get("t_value", None)
        if t_enabled is not None:
            tags.append("dkim13")

        return tags
