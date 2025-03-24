import asyncio
import json
import logging

import time
from nats.js import JetStreamContext
from nats.js.errors import KeyNotFoundError, NoKeysError
from nats.js.kv import KeyValue


logger = logging.getLogger(__name__)

cleanup_leader_key = "ip_cleanup_leader"


async def acquire_cleanup_leader(kv: KeyValue, instance_id: str) -> bool:
    # Try to become the cleanup leader using a KV entry with expiration
    try:
        # Try to create or update the leader key
        leader_data = json.dumps(
            {"instance_id": instance_id, "updated_at": int(time.time())}
        ).encode()

        try:
            # Check if key exists and who owns it
            entry = await kv.get(cleanup_leader_key)
            leader_info = json.loads(entry.value.decode())

            # If it's been more than 60 seconds, take over leadership
            if time.time() - leader_info.get("updated_at", 0) > 60:
                await kv.update(cleanup_leader_key, leader_data, entry.revision)
                return True

            # Check if already the leader
            return leader_info.get("instance_id") == instance_id

        except KeyNotFoundError:
            # Key doesn't exist, create it
            await kv.create(cleanup_leader_key, leader_data)
            return True
    except Exception as e:
        logger.error(f"Unexpected error acquiring leadership: {e}")
        return False


async def maintain_leadership(kv: KeyValue, instance_id: str):
    # Periodically update updated_at to maintain leadership
    while True:
        try:
            entry = await kv.get(cleanup_leader_key)
            leader_info = json.loads(entry.value.decode())

            # Only update if we're the leader
            if (
                leader_info.get("instance_id") == instance_id
                and leader_info.get("updated_at") - time.time() > 10
            ):
                leader_info["updated_at"] = int(time.time())
                await kv.update(
                    cleanup_leader_key, json.dumps(leader_info).encode(), entry.revision
                )
        except Exception as e:
            logger.error(f"Error maintaining leadership: {e}")

        # Update every 20 seconds (shorter than the 60s expiration)
        await asyncio.sleep(20)


async def cleanup_stale_slots(kv: KeyValue):
    # Clean up any stale IP slots
    # Intended to be run by the cleanup leader

    try:
        keys = await kv.keys()
        now = int(time.time())
        stale_threshold = 90  # Clean up slots older than 90 seconds

        for key in keys:
            try:
                entry = await kv.get(key)
                data = json.loads(entry.value.decode())
                if (
                    "updated_at" in data
                    and now - data["updated_at"] > stale_threshold
                    and data.get("count", 0) > 0
                ):
                    data["count"] = 0
                    data["updated_at"] = now
                    await kv.update(key, json.dumps(data).encode(), entry.revision)
                    logger.info(f"Reset stale slot for IP {key}")
            except Exception as e:
                logger.error(f"Error processing key {key}: {e}")
    except NoKeysError:
        logger.debug("No keys to clean up")
    except Exception as e:
        logger.error(f"Error cleaning up stale slots: {e}")


async def leader_election_service(js: JetStreamContext, instance_id: str):
    # Main service that handles leader election and cleanup
    leader_kv = await js.key_value("LEADERS")
    ip_slot_kv = await js.key_value("WEB_SCANNER_IPS")

    # Start leadership maintenance in the background
    maintenance_task = None

    while True:
        is_leader = await acquire_cleanup_leader(leader_kv, instance_id)

        if is_leader:
            logger.info(f"Instance {instance_id} is the cleanup leader")

            # Start/restart the maintenance task
            if maintenance_task is None or maintenance_task.done():
                maintenance_task = asyncio.create_task(
                    maintain_leadership(leader_kv, instance_id)
                )

            # Run the cleanup
            await cleanup_stale_slots(ip_slot_kv)
        else:
            logger.debug(f"Instance {instance_id} is not the cleanup leader")

            # Cancel maintenance task if not the leader
            if maintenance_task is not None and not maintenance_task.done():
                maintenance_task.cancel()
                maintenance_task = None

        # Check leadership status periodically
        await asyncio.sleep(60)
