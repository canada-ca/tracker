import graphene


class DkimSelectors(graphene.ObjectType):
    """
    This object contains the scan result data for each individual selector that
    has been scanned.
    """

    selector = graphene.String(description="Selector domain that has been scanned.")
    record = graphene.String(
        description="DKIM record retrieved during the scan of the given domain."
    )
    key_length = graphene.String(description="Length of DKIM public key.")
    dkim_guidance_tags = graphene.List(
        lambda: graphene.String, description="Key tags found during scan."
    )

    def resolve_selector(self, info, **kwargs):
        selector = self.selector
        return selector

    def resolve_record(self: dict, info, **kwargs):
        record = self.record.get("txt_record", None)
        return record

    def resolve_key_length(self, info, **kwargs):
        key_length = self.key_length.get("key_size", None)
        return key_length

    def resolve_dkim_guidance_tags(self, info, **kwargs):
        tags = []

        if self.dkim_guidance_tags.get("missing", None) is not None:
            tags.append("dkim2")
            return tags

        # Get Key Size, and Key Type
        key_size = self.dkim_guidance_tags.get("key_size", None)
        key_type = self.dkim_guidance_tags.get("key_type", None)

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
        key_invalid = self.dkim_guidance_tags.get("update-recommend", None)

        if key_invalid is not None:
            if key_invalid is True:
                tags.append("dkim10")

        # Invalid Crypto
        invalid_crypto = self.dkim_guidance_tags.get("txt_record", {}).get("k", None)

        if invalid_crypto is not None:
            # if k != rsa
            if invalid_crypto != "rsa":
                tags.append("dkim11")

        # Dkim value invalid
        # Check if v, k, and p exist in txt_record
        v_tag = self.dkim_guidance_tags.get("txt_record", {}).get("v", None)
        k_tag = self.dkim_guidance_tags.get("txt_record", {}).get("k", None)
        p_tag = self.dkim_guidance_tags.get("txt_record", {}).get("p", None)

        if v_tag is None and k_tag is None and p_tag is None:
            if "dkim12" not in tags:
                tags.append("dkim12")

        # Testing Enabled
        t_enabled = self.dkim_guidance_tags.get("t_value", None)
        if t_enabled is not None:
            tags.append("dkim13")

        return tags
