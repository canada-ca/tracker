import os
import sys
import requests
import logging
import json
import emoji
from scan import https
from starlette.applications import Starlette
from starlette.routing import Route, Mount, WebSocketRoute
from starlette.responses import PlainTextResponse, JSONResponse

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def startup():
    logging.info(emoji.emojize("ASGI server started :rocket:"))


def initiate(received_payload):

    logging.info("Scan received")

    try:
        scan_id = received_payload["scan_id"]
        domain = received_payload["domain"]

        # Perform scan
        scan_response = requests.post("http://127.0.0.1:8000/scan", data=domain)

        scan_results = scan_response.json()

        # Construct request payload for result-processor
        if scan_results is not {}:
            payload = json.dumps(
                {"results": scan_results, "scan_type": "https", "scan_id": scan_id}
            )
            logging.info(str(scan_results))
        else:
            raise Exception("HTTPS scan not completed")

        # Dispatch results to result-processor
        dispatch_response = requests.post(
            "http://127.0.0.1:8000/dispatch", json=payload
        )

        return f"HTTPS scan completed. {dispatch_response.text}"

    except Exception as e:
        logging.error(str(e))
        return f"An error occurred while attempting to perform HTTPS scan: {str(e)}"


def dispatch_results(payload, client):
    # Post results to result-handling service
    client.post(
        url="http://result-processor.tracker.svc.cluster.local/receive", json=payload
    )


def scan_https(domain):
    try:
        # Run https-scanner
        res_dict = https.run([domain])

        # Return scan results for the designated domain
        return res_dict[domain]
    except Exception as e:
        logging.error("An error occurred while scanning domain - %s", str(e))
        return {}


def Server(functions={}, client=requests):
    async def receive(request):
        logging.info("Request received")
        payload = await request.json()
        return PlainTextResponse(initiate(payload))

    async def dispatch(request):
        try:
            payload = await request.json()
            functions["dispatch"].dispatch(payload, client)
        except Exception as e:
            return PlainTextResponse(str(e))
        return PlainTextResponse("Scan results sent to result-processor")

    async def scan(request):
        domain = await request.body()
        logging.info("Performing scan...")
        return JSONResponse(functions["scan"].scan(domain.decode("utf-8")))

    routes = [
        Route("/dispatch", dispatch, methods=["POST"]),
        Route("/scan", scan, methods=["POST"]),
        Route("/receive", receive, methods=["POST"]),
    ]

    return Starlette(debug=True, routes=routes, on_startup=[startup])


def Scan(scan_function):
    scan_function = scan_function

    def scan(domain):
        return scan_function(domain)


def Dispatcher(dispatch_function):
    dispatch_function = dispatch_function

    def dispatch(payload, client):
        dispatch_function(payload, client)


app = Server(functions={"dispatch": Dispatcher(dispatch_results), "scan": Scan(scan_https)})
