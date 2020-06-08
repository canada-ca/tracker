import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from models import Dkim_scans


class DkimTags(SQLAlchemyObjectType):
    class Meta:
        model = Dkim_scans
        exclude_fields = ("id", "dkim_scan")

    value = graphene.List(
        lambda: graphene.String,
        description="Key tags found during scan",
    )

    def resolve_value(self: Dkim_scans, info):
        tags = []

        if self.dkim_scan.get("dkim", {}).get("missing", None) is not None:
            print("WHY WONT THIS WORK")
            tags.append({"dkim2": "DKIM-missing"})
            return tags

        # Get Key Size, and Key Type
        key_size = self.dkim_scan.get("dkim", {}) \
            .get("key_size", None)
        key_type = self.dkim_scan.get("dkim", {}) \
            .get("key_type", None)

        if key_size is None:
            tags.append({"dkim9": "P-invalid"})
        elif key_type is None:
            tags.append({"dkim9": "P-invalid"})
        else:
            if key_size >= 4096 and key_type == "rsa":
                tags.append({"dkim8": "P-4096"})
            elif key_size >= 2048 and key_type == "rsa":
                tags.append({"dkim7": "P-2048"})
            elif key_size == 1024 and key_type == "rsa":
                tags.append({"dkim6": "P-1024"})
            elif key_size < 1024 and key_type == "rsa":
                tags.append({"dkim5": "P-sub1024"})
            else:
                tags.append({"dkim9": "P-invalid"})

        # Update Recommended
        key_invalid = self.dkim_scan.get("dkim", {}) \
            .get("update-recommend", None)

        if key_invalid:
            tags.append({"dkim10": "P-update-recommended"})

        # Invalid Crypto
        invalid_crypto = self.dkim_scan.get("dkim", {}) \
            .get("txt_record", {}) \
            .get("k", None)
        # if k != rsa
        if invalid_crypto != 'rsa':
            tags.append({"dkim11": "DKIM-invalid-crypto"})

        # Dkim value invalid
        # Check if v, k, and p exist in txt_record
        v_tag = self.dkim_scan.get("dkim", {}) \
            .get("txt_record", {}) \
            .get("v", None)
        k_tag = self.dkim_scan.get("dkim", {}) \
            .get("txt_record", {}) \
            .get("k", None)
        p_tag = self.dkim_scan.get("dkim", {}) \
            .get("txt_record", {}) \
            .get("p", None)

        if v_tag is None and k_tag is None and p_tag is None:
            tags.append({"dkim12": "DKIM-value-invalid"})

        # Testing Enabled
        t_enabled = self.dkim_scan.get("dkim", {}) \
            .get("t_value")
        if t_enabled is not None:
            tags.append({"dkim13": "T-enabled"})

        return tags
