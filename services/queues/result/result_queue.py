"""A WSGI app that receives JSON scan results via HTTP and enqueues them to be dispatched to the results processor"""
import os
import sys
import time
import requests
import logging
import json
import emoji
import traceback
import asyncio
from threading import Thread
from flask import Flask, request
from redis import Redis, ConnectionPool
from rq import Queue, Retry, Worker

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
pool = ConnectionPool(host="127.0.0.1", port=6379, db=0)

PROCESSOR_URL = os.getenv("PROCESSOR_URL", "http://result-processor.scanners.svc.cluster.local")

redis = Redis(connection_pool=pool)
https_queue = Queue("https", connection=redis)
ssl_queue = Queue("ssl", connection=redis)
dns_queue = Queue("dns", connection=redis)

default_queues = {"https": https_queue, "ssl": ssl_queue, "dns": dns_queue}


def Server(process_name, queues=default_queues):
    """Flask app that adds incoming JSON scan results to Redis queues to be dispatched later.

    Routes are /https, /ssl and /dns.

    Needs a Redis server to function and RQ workers must be started for results to be dispatched.

    :param str process_name: process name to run flask app as.
    :param dict queues: dict with RQ Queues for each scanner.
    :return: This Flask app.
    :rtype: Flask
    """
    flask_app = Flask(process_name)
    flask_app.config["queues"] = queues

    @flask_app.route("/https", methods=["POST"])
    def enqueue_https():
        """Enqueues a result processing request received at /https to the HTTPS Redis Queue.

        :return: a message indicating whether the result processing request was enqueued successfully.
        :rtype: str
        """
        logging.info("HTTPS result processing request received.")
        try:
            payload = request.get_json(force=True)
            designated_queue = flask_app.config["queues"].get("https", None)
            designated_queue.enqueue(
                dispatch_https,
                payload,
                retry=Retry(max=3),
                job_timeout=86400,
                result_ttl=86400,
            )
            msg = "HTTPS result processing request enqueued."
            logging.info(msg)
        except Exception as e:
            msg = f"An unexpected error occurred while attempting to enqueue HTTPS result processing request: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg

    @flask_app.route("/ssl", methods=["POST"])
    def enqueue_ssl():
        """Enqueues a result processing request received at /ssl to the SSL Redis Queue.

        :return: a message indicating whether the result processing request was enqueued successfully.
        :rtype: str
        """
        logging.info("SSL result processing request received.")
        try:
            payload = request.get_json(force=True)
            designated_queue = flask_app.config["queues"].get("ssl", None)
            designated_queue.enqueue(
                dispatch_ssl,
                payload,
                retry=Retry(max=3),
                job_timeout=86400,
                result_ttl=86400,
            )
            msg = "SSL result processing request enqueued."
            logging.info(msg)
        except Exception as e:
            msg = f"An unexpected error occurred while attempting to enqueue SSL result processing request: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg

    @flask_app.route("/dns", methods=["POST"])
    def enqueue_dns():
        """Enqueues a result processing request received at /dns to the DNS Redis Queue.

        :return: a message indicating whether the result processing request was enqueued successfully.
        :rtype: str
        """
        logging.info("DNS result processing request received.")
        try:
            payload = request.get_json(force=True)
            designated_queue = flask_app.config["queues"].get("dns", None)
            designated_queue.enqueue(
                dispatch_dns,
                payload,
                retry=Retry(max=3),
                job_timeout=86400,
                result_ttl=86400,
            )
            msg = "DNS result processing request enqueued."
            logging.info(msg)
        except Exception as e:
            msg = f"An unexpected error occurred while attempting to enqueue DNS result processing request: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg

    return flask_app


app = Server(__name__)


def dispatch_https(payload):
    """Dispatches an HTTPS result processing request to the result processor.

    Enqueued alongside the request to be executed by an RQ worker.

    :param dict payload: JSON HTTPS scan results for a domain from a scanner.
    :return: A message indicating whether the request was dispatched successfully.
    :rtype: str
    """
    logging.info("Dispatching HTTPS result processing request")
    try:
        requests.post(PROCESSOR_URL, json=payload)
        return "Dispatched HTTPS result processing request."
    except Exception as e:
        msg = f"An unexpected error occurred while attempting to dispatch HTTPS result processing request: ({type(e).__name__}: {str(e)})"
        logging.error(msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg


def dispatch_ssl(payload):
    """Dispatches an SSL result processing request to the result processor.

    Enqueued alongside the request to be executed by an RQ worker.

    :param dict payload: JSON SSL scan results for a domain from a scanner.
    :return: A message indicating whether the request was dispatched successfully.
    :rtype: str
    """
    logging.info("Dispatching SSL result processing request")
    try:
        requests.post(PROCESSOR_URL, json=payload)
        return "Dispatched SSL result processing request."
    except Exception as e:
        msg = f"An unexpected error occurred while attempting to dispatch SSL result processing request: ({type(e).__name__}: {str(e)})"
        logging.error(msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg


def dispatch_dns(payload):
    """Dispatches a DNS result processing request to the result processor.

    Enqueued alongside the request to be executed by an RQ worker.

    :param dict payload: JSON DNS scan results for a domain from a scanner.
    :return: A message indicating whether the request was dispatched successfully.
    :rtype: str
    """
    logging.info("Dispatching DNS result processing request")
    try:
        requests.post(PROCESSOR_URL, json=payload)
        return "Dispatched DNS result processing request."
    except Exception as e:
        msg = f"An unexpected error occurred while attempting to dispatch DNS result processing request: ({type(e).__name__}: {str(e)})"
        logging.error(msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg
