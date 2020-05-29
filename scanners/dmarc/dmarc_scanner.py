import os
import sys
import requests
import logging
import json
import emoji
import tldextract
from checkdmarc import *
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse, JSONResponse

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def startup():
    logging.info(emoji.emojize("ASGI server started :rocket:"))


def initiate(received_payload, client):

    logging.info("Scan received")

    try:
        scan_id = received_payload["scan_id"]
        ext = tldextract.extract(received_payload["domain"])
        domain = ext.registered_domain

        # Perform scan
        scan_response = client.post(
            "http://127.0.0.1:8000/scan", data={"domain": domain}
        )

        scan_results = scan_response.json()

        # Construct request payload for result-processor
        if scan_results is not None:
            payload = json.dumps(
                {"results": scan_results, "scan_type": "dmarc", "scan_id": scan_id}
            )
            logging.info(str(scan_results))
        else:
            raise Exception("DMARC scan not completed")

        # Dispatch results to result-processor
        dispatch_response = client.post(
            "http://127.0.0.1:8000/dispatch", data=payload
        )

        return f"DMARC scan completed. {dispatch_response.text}"

    except Exception as e:
        logging.error(str(e))
        return f"An error occurred while attempting to perform DMARC scan: {str(e)}"


def dispatch_results(payload, client):
    # Post results to result-handling service
    client.post(
        url="http://result-processor.tracker.svc.cluster.local/receive", json=payload
    )


def scan_dmarc(domain):

    # Single-item list to pass off to check_domains function
    domain_list = list()
    domain_list.append(domain)

    try:
        # Perform "checkdmarc" scan on provided domain
        scan_result = json.loads(json.dumps(check_domains(domain_list, skip_tls=True)))
    except (DNSException, SPFError, DMARCError) as e:
        logging.error(
            "Failed to check the given domains for DMARC/SPF records: %s" % str(e)
        )
        return None

    if scan_result["dmarc"].get("record", "null") == "null":
        return None
    else:
        return scan_result


def Server(functions={}, default_client=requests):
    async def receive(request):
        logging.info("Request received")
        client = request.app.state.client
        payload = await request.json()
        return PlainTextResponse(initiate(payload, client))

    async def dispatch(request):
        try:
            client = request.app.state.client
            payload = await request.json()
            functions["dispatch"](payload, client)
        except Exception as e:
            return PlainTextResponse(str(e))
        return PlainTextResponse("Scan results sent to result-processor")

    async def scan(request):
        domain = await request.body()
        logging.info("Performing scan...")
        return JSONResponse(functions["scan"](domain.decode("utf-8")))

    routes = [
        Route("/dispatch", dispatch, methods=["POST"]),
        Route("/scan", scan, methods=["POST"]),
        Route("/receive", receive, methods=["POST"]),
    ]

    starlette_app = Starlette(debug=True, routes=routes, on_startup=[startup])

    starlette_app.state.client = default_client

    return starlette_app


def Scan(scan_type):
    scan_function = scan_type

    def scan(domain):
        return scan_function(domain)

    return scan


def Dispatcher(dispatch_type):
    dispatch_function = dispatch_type

    def dispatch(payload, client):
        dispatch_function(payload, client)

    return dispatch


app = Server(
    functions={"dispatch": Dispatcher(dispatch_results), "scan": Scan(scan_https)}
)
