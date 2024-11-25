import logging
from typing import TypedDict, Iterable

from arango.database import StandardDatabase
from azure.cosmos import ContainerProxy

logger = logging.getLogger()


class SelectorDoc(TypedDict):
    selector: str
    first_seen: str
    last_seen: str


class DomainSelectorDoc(TypedDict):
    id: str
    data: list[SelectorDoc]


def update_selectors(
    arango_db: StandardDatabase,
    selector_container: ContainerProxy,
    remove_selectors: bool = False,
):
    selectors_iterable: Iterable[DomainSelectorDoc] = selector_container.query_items(
        query="SELECT * FROM c",
        enable_cross_partition_query=True,
    )

    # Update selectors
    for selector_doc in selectors_iterable:
        logger.info(f"Processing {selector_doc['id']}")

        # Get domain from ArangoDB
        try:
            domain_cursor = arango_db.aql.execute(
                """
                FOR domain IN domains
                    FILTER domain.domain == @domain
                    RETURN domain
                """,
                bind_vars={
                    "domain": selector_doc["id"],
                },
            )
            domain = next(domain_cursor)
        except Exception as e:
            logger.error(f"Failed to get domain {selector_doc['id']}: {e}")
            continue

        for selector in selector_doc["data"]:
            logger.info(f"Processing {selector_doc['id']} {selector['selector']}")
            # Skip selector if last_seen is older than 1 year
            current_date = datetime.now()
            selector_date = datetime.strptime(selector["last_seen"], "%Y-%m-%d")
            date_diff = (current_date - selector_date).days

            if date_diff > 365:
                logger.info(
                    f"Skipping {selector_doc['id']} {selector['selector']} - last seen {date_diff} days ago"
                )
                continue

            # Ensure selectors exist in ArangoDB (upsert)
            try:
                logger.info(f"Upserting {selector['selector']}")
                selector_cursor = arango_db.aql.execute(
                    """
                    UPSERT { selector: @selector }
                        INSERT { selector: @selector }
                        UPDATE {}
                        IN selectors
                    RETURN NEW
                    """,
                    bind_vars={
                        "selector": selector["selector"],
                    },
                )
                arango_selector_doc = next(selector_cursor)
            except Exception as e:
                logger.error(f"Failed to upsert {selector['selector']}: {e}")
                continue

            # Ensure domain to selector edge exists in ArangoDB (upsert)
            try:
                logger.info(f"Upserting {selector_doc['id']} {selector['selector']}")
                arango_db.aql.execute(
                    """
                    UPSERT { _from: @domain, _to: @selector }
                        INSERT { _from: @domain, _to: @selector, firstSeen: @firstSeen, lastSeen: @lastSeen }
                        UPDATE { firstSeen: @firstSeen, lastSeen: @lastSeen }
                        IN domainsToSelectors
                    """,
                    bind_vars={
                        "domain": domain["_id"],
                        "selector": arango_selector_doc["_id"],
                        "firstSeen": selector["first_seen"],
                        "lastSeen": selector["last_seen"],
                    },
                )
            except Exception as e:
                logger.error(
                    f"Failed to upsert {selector_doc['id']} {selector['selector']}: {e}"
                )

    if remove_selectors:
        # Remove selectors that are older than 1 year
        logger.info("Removing old selector edges")

        removed_edges_cursor = arango_db.aql.execute(
            """
            FOR edge IN domainsToSelectors
                LET date_diff_in_days = DATE_DIFF(edge.lastSeen, DATE_NOW(), "d")
                FILTER !!edge.lastSeen && date_diff_in_days > 365
                LET from_domain = DOCUMENT(edge._from).domain
                LET to_selector = DOCUMENT(edge._to).selector
                REMOVE edge IN domainsToSelectors
                RETURN {
                    _id: OLD._id,
                    from_domain: from_domain,
                    to_selector: to_selector,
                    date_diff_in_days: date_diff_in_days,
                }
            """
        )
        for edge in removed_edges_cursor:
            logger.info(
                f"Removed edge {edge['_id']} from {edge['from_domain']} to {edge['to_selector']} - ({edge['date_diff_in_days']} days old)"
            )
    else:
        # Get selectors that are older than 1 year
        logger.info("Getting old selector edges")
        old_edges_cursor = arango_db.aql.execute(
            """
            FOR edge IN domainsToSelectors
                LET date_diff_in_days = DATE_DIFF(edge.lastSeen, DATE_NOW(), "d")
                FILTER !!edge.lastSeen && date_diff_in_days > 365
                RETURN {
                    _id: edge._id,
                    from_domain: DOCUMENT(edge._from).domain,
                    to_selector: DOCUMENT(edge._to).selector,
                    date_diff_in_days: date_diff_in_days,
                }
            """
        )
        for edge in old_edges_cursor:
            logger.info(
                f"Old edge {edge['_id']} from {edge['from_domain']} to {edge['to_selector']} - ({edge['date_diff_in_days']} days old)"
            )
