"""Compute and apply the changes needed to align HackerOne assets with the domain DB."""

import logging
from collections.abc import Callable
from dataclasses import dataclass

from hackerone import (
    HackerOneAPIError,
    add_scope,
    archive_assets,
    create_asset,
    get_scope,
    update_scope,
)

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Changes:
    """Work to perform against HackerOne.

    new_enrolled / new_denied: domain documents not yet in H1.
    rescope_to_enrolled / rescope_to_denied: identifiers of existing assets to rescope.
    to_archive: in-scope H1 assets whose domain is neither enrolled nor denied.
    """

    new_enrolled: tuple[dict, ...]
    new_denied: tuple[dict, ...]
    rescope_to_enrolled: tuple[str, ...]
    rescope_to_denied: tuple[str, ...]
    to_archive: tuple[dict, ...]

    @property
    def newly_enrolled_names(self) -> list[str]:
        """Domain names to announce: newly created enrolled plus rescoped to enrolled."""
        return [d["domain"] for d in self.new_enrolled] + list(self.rescope_to_enrolled)


def asset_identifier(asset: dict) -> str | None:
    """Return the asset's identifier, or None when missing or empty."""
    return (asset.get("attributes") or {}).get("identifier") or None


def asset_id_by_identifier(assets: list[dict]) -> dict[str, str]:
    """Map asset identifier to H1 asset id, skipping assets without an identifier."""
    return {identifier: a["id"] for a in assets if (identifier := asset_identifier(a))}


def compute_changes(
    all_domains: list[dict],
    enrolled: list[dict],
    denied: list[dict],
    in_scope_assets: list[dict],
    out_of_scope_assets: list[dict],
) -> Changes:
    """Pure diff of DB domains against H1 assets. Domains and assets lacking an identifier are ignored."""
    in_scope = {i for a in in_scope_assets if (i := asset_identifier(a))}
    out_of_scope = {i for a in out_of_scope_assets if (i := asset_identifier(a))}
    known_to_h1 = in_scope | out_of_scope
    all_names = {d["domain"] for d in all_domains if d.get("domain")}
    enrolled_names = {d["domain"] for d in enrolled if d.get("domain")}
    denied_names = {d["domain"] for d in denied if d.get("domain")}

    return Changes(
        new_enrolled=tuple(
            d for d in enrolled if d.get("domain") and d["domain"] not in known_to_h1
        ),
        new_denied=tuple(d for d in denied if d.get("domain") and d["domain"] not in known_to_h1),
        rescope_to_enrolled=tuple(
            d["domain"] for d in enrolled if d.get("domain") in out_of_scope
        ),
        rescope_to_denied=tuple(i for i in sorted(in_scope) if i in denied_names),
        to_archive=tuple(
            a
            for a in in_scope_assets
            if (i := asset_identifier(a))
            and i not in enrolled_names
            and i not in denied_names
            and i in all_names
        ),
    )


def _attempt(failure_message: str, action: Callable[[], dict]) -> bool:
    """Run `action`, log its response, and return True; log an error and return False on API failure."""
    try:
        logger.info(action())
        return True
    except HackerOneAPIError as e:
        logger.error(f"{failure_message}: {e}")
        return False


def create_assets(
    domains: list[dict], asset_tags: list[dict], owners: dict[str, str]
) -> tuple[int, int]:
    """Create H1 assets with scope for `domains`; return (successes, failures).

    `owners` maps domain `_id` to org externalId; `asset_tags` is [{"name", "id"}].
    A domain with no owner or no matching tag counts as a failure.
    """
    tag_id_by_name = {tag["name"]: tag["id"] for tag in asset_tags}
    successes = failures = 0
    for domain_doc in domains:
        domain = domain_doc["domain"]
        owner = owners.get(domain_doc["_id"])
        if owner is None:
            logger.error(f"No owner organization found for {domain}, skipping creation.")
            failures += 1
            continue
        tag_id = tag_id_by_name.get(owner)
        if tag_id is None:
            logger.error(f"No asset tag found for org {owner} (domain {domain}), skipping creation.")
            failures += 1
            continue

        options = domain_doc.get("cvdEnrollment", {})

        def create_with_scope(domain=domain, options=options, tag_id=tag_id) -> dict:
            created = create_asset(domain=domain, options=options, asset_tag_id=int(tag_id))
            logger.info(created)
            return add_scope(
                asset_id=created.get("data", {}).get("id"),
                enrollment_status=options.get("status"),
            )

        if _attempt(f"Failed to create asset {domain}", create_with_scope):
            successes += 1
        else:
            failures += 1
    return successes, failures


def rescope_assets(
    domain_names: list[str] | tuple[str, ...],
    enrollment_status: str,
    asset_id_map: dict[str, str],
) -> tuple[int, int]:
    """Set each domain's H1 scope to `enrollment_status`; return (successes, failures)."""
    successes = failures = 0
    for domain in domain_names:

        def update(domain=domain) -> dict:
            asset_id = asset_id_map.get(domain)
            if not asset_id:
                raise HackerOneAPIError(f"No asset ID found for {domain}")
            scope_data = get_scope(asset_id).get("data", [])
            if not scope_data:
                raise HackerOneAPIError(f"No existing scope entry found for {domain}")
            return update_scope(
                asset_id=asset_id,
                scope_id=scope_data[0].get("id", ""),
                enrollment_status=enrollment_status,
            )

        if _attempt(f"Failed to update scope for {domain}", update):
            successes += 1
        else:
            failures += 1
    return successes, failures


def archive(assets: list[dict] | tuple[dict, ...]) -> bool:
    """Archive `assets` in H1; return True on success."""
    return _attempt(
        "Error(s) while archiving CVD assets", lambda: archive_assets(data={"data": list(assets)})
    )
