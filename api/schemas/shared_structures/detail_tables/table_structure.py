import graphene


class TableStructure(graphene.ObjectType):
    """
    Object that contains the fields of each detail table
    """
    source_ip_address = graphene.String(description="IP address of sending server")
    envelope_from = graphene.String(description="Domain from SMTP banner message")
    spf_domains = graphene.String(description="Domains used for SPF validation")
    dkim_domains = graphene.String(description="Domains used for DKIM validation")
    dkim_selectors = graphene.String(
        description="Pointer to a DKIM public key record in DNS"
    )
    total_messages = graphene.Int(description="Total messages related to this record")
    country_code = graphene.String(
        description="Geographic location of source IP address"
    )
    isp_org = graphene.String(description="Owner of ISP for source IP address")
    prefix_org = graphene.String(description="Owner of prefix for source IP address")
    as_name = graphene.String(description="Name of AS for source IP address")
    as_num = graphene.Int(description="Number of AS for source IP address")
    as_org = graphene.String(description="Owner of AS for source IP address")
    dns_host = graphene.String(description="Host from reverse DNS of source IP address")
    dns_domain = graphene.String(
        description="Domain from reverse DNS of source IP address"
    )

    def resolve_source_ip_address(self: dict, info):
        return self.get("sourceIpAddress")

    def resolve_envelope_from(self: dict, info):
        return self.get("envelopeFrom")

    def resolve_spf_domains(self: dict, info):
        return self.get("spfDomains")

    def resolve_dkim_domains(self: dict, info):
        return self.get("dkimDomains")

    def resolve_dkim_selectors(self: dict, info):
        return self.get("dkimSelectors")

    def resolve_total_messages(self: dict, info):
        return self.get("totalMessages")

    def resolve_country_code(self: dict, info):
        return self.get("countryCode")

    def resolve_isp_org(self: dict, info):
        return self.get("ispOrg")

    def resolve_prefix_org(self: dict, info):
        return self.get("prefixOrg")

    def resolve_as_name(self: dict, info):
        return self.get("asName")

    def resolve_as_num(self: dict, info):
        return self.get("asNum")

    def resolve_as_org(self: dict, info):
        return self.get("asOrg")

    def resolve_dns_host(self: dict, info):
        return self.get("dnsHost")

    def resolve_dns_domain(self: dict, info):
        return self.get("dnsDomain")
