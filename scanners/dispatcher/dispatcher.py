import os
import sys
import logging
import requests
import jwt
import datetime
import uvicorn
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse
from starlette.background import BackgroundTasks

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

TOKEN_KEY = os.getenv("TOKEN_KEY")

hosts = [
    "http://https-scanner.tracker.svc.cluster.local",
    "http://ssl-scanner.tracker.svc.cluster.local",
    "http://dmarc-scanner.tracker.svc.cluster.local",
]

dkim_flagged_hosts = [
    "http://dkim-scanner.tracker.svc.cluster.local",
    "http://dmarc-scanner.tracker.svc.cluster.local",
]

manual_scan_hosts = [
    "http://https-scanner-manual.tracker.svc.cluster.local",
    "http://ssl-scanner-manual.tracker.svc.cluster.local",
    "http://dmarc-scanner-manual.tracker.svc.cluster.local",
]

manual_scan_dkim_flagged_hosts = [
    "http://dkim-scanner-manual.tracker.svc.cluster.local",
    "http://dmarc-scanner-manual.tracker.svc.cluster.local",
]


def initiate(request):

    logging.info("Request received")

    try:
        decoded_payload = jwt.decode(
            request.headers.get("Data"), TOKEN_KEY, algorithm=["HS256"]
        )

        payload = {
            "scan_id": decoded_payload["scan_id"],
            "domain": decoded_payload["domain"],
        }

        dkim_flag = decoded_payload["dkim"]
        user_init = decoded_payload["user_init"]
        scan_id = decoded_payload["scan_id"]

        func_dict = {"Dispatcher": request.headers.get("Dispatcher"),
                     "Scanners": request.headers.get("Scanners"),
                     "Results": request.headers.get("Results")
                     }

        encrypted_payload = jwt.encode(payload, TOKEN_KEY, algorithm="HS256").decode(
            "utf-8"
        )

        msg = dispatch(encrypted_payload, dkim_flag, user_init, scan_id, func_dict)

        return PlainTextResponse("Scan request parsed: %s", msg)

    except jwt.ExpiredSignatureError as e:
        logging.error("Failed (Expired Signature - 406): %s\n" % str(e))
        return PlainTextResponse("Failed to dispatch domain to designated scanner(s)")

    except jwt.InvalidTokenError as e:
        logging.error("Failed (Invalid Token - 401): %s\n" % str(e))
        return PlainTextResponse("Failed to dispatch domain to designated scanner(s)")

    except Exception as e:
        logging.error("Failed: %s\n" % str(e))
        return PlainTextResponse("Failed to dispatch domain to designated scanner(s)")


def dispatch(encrypted_payload, dkim_flag, user_init, scan_id, func_dict):
    """
    Dispatch scans to designated scanners
    :param encrypted_payload: Dict containing scan info, encrypted by JWT
    :param dkim_flag: Flag indicating whether this is a dkim scan
    :param user_init: Flag indicating whether this is a user-initiated scan
    :param scan_id: ID of the scan object
    """

    tasks = BackgroundTasks()

    headers = {
        "Content-Type": "application/json",
        "Data": encrypted_payload,
        "Scanners": func_dict["Scanners"],
        "Results": func_dict["Results"]
    }

    dispatched = {scan_id: {}}
    target_func = globals()[func_dict["Dispatcher"]]

    try:
        if not user_init:
            if dkim_flag is True:
                for host in dkim_flagged_hosts:
                    tasks.add_task(target_func, host=dispatched[scan_id][host], headers=headers)
                    logging.info("Scan %s dispatched...\n" % scan_id)
            else:
                for host in hosts:
                    tasks.add_task(target_func, host=dispatched[scan_id][host], headers=headers)
                    logging.info("Scan %s dispatched...\n" % scan_id)
        else:
            if dkim_flag is True:
                for host in manual_scan_dkim_flagged_hosts:
                    tasks.add_task(target_func, host=dispatched[scan_id][host], headers=headers)
                    logging.info("Scan %s dispatched...\n" % scan_id)
            else:
                for host in manual_scan_hosts:
                    tasks.add_task(target_func, host=dispatched[scan_id][host], headers=headers)
                    logging.info("Scan %s dispatched...\n" % scan_id)

    except Exception as e:
        logging.error(
            "(SCAN: %s) - Error occurred while sending dispatching scan(s): %s\n"
            % (scan_id, str(e))
        )
        return PlainTextResponse("Error occurred while sending dispatching scan(s): %s" % str(e))

    return PlainTextResponse("Domain dispatched to designated scanner(s)", background=tasks)


async def send(host, headers):
    requests.post(host + "/receive", headers=headers)


async def mock_send(host, headers):
    return


def startup():
    print("ASGI server started...")


routes = [
    Route('/receive', initiate),
]

app = Starlette(debug=True, routes=routes, on_startup=[startup])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
