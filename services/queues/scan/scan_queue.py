"""A WSGI app that receives JSON scan requests via HTTP and enqueues them to be dispatched to the appropriate scanner"""
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

# ConnectionPool for Redis server running in the same container as this app; see Dockerfile
pool = ConnectionPool(host="127.0.0.1", port=6379, db=0)

HTTPS_URL = os.getenv("HTTPS_URL", "http://https-scanner.scanners.svc.cluster.local")
SSL_URL = os.getenv("SSL_URL", "http://ssl-scanner.scanners.svc.cluster.local")
DNS_URL = os.getenv("DNS_URL", "http://dns-scanner.scanners.svc.cluster.local")

redis = Redis(connection_pool=pool)

# RQ queues for scan dispatches, RQ workers must be running for jobs to be executed
https_queue = Queue("https", connection=redis)
ssl_queue = Queue("ssl", connection=redis)
dns_queue = Queue("dns", connection=redis)

default_queues = {"https": https_queue, "ssl": ssl_queue, "dns": dns_queue}


def Server(process_name, queues=default_queues):
    """Flask app that adds incoming JSON scan requests to Redis queues to be dispatched later.

    Routes are /https, /ssl and /dns.

    Needs a Redis server to function and RQ workers must be started for scans to be dispatched.

    :param str process_name: process name to run flask app as.
    :param dict queues: dict with RQ Queues for each scanner.
    :return: This Flask app.
    :rtype: Flask
    """
    flask_app = Flask(process_name)
    flask_app.config["queues"] = queues

    @flask_app.route("/https", methods=["POST"])
    def enqueue_https():
        """Enqueues a request received at /https to the HTTPS Redis Queue

        :return: a message indicating whether the request was enqueued successfully.
        :rtype: str
        """
        logging.info("HTTPS scan request received.")
        try:
            payload = request.get_json(force=True)
            designated_queue = flask_app.config["queues"].get("https", None)
            designated_queue.enqueue(
                dispatch_https,
                payload,
                retry=Retry(max=3, interval=[10, 30, 60]),
                job_timeout=86400,
                result_ttl=86400,
            )
            msg = "HTTPS scan request enqueued."
            logging.info(msg)
        except Exception as e:
            msg = f"An unexpected error occurred while attempting to enqueue HTTPS scan request: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg

    @flask_app.route("/ssl", methods=["POST"])
    def enqueue_ssl():
        """Enqueues a request received at /ssl to the SSL Redis Queue

        :return: a message indicating whether the request was enqueued successfully.
        :rtype: str
        """
        logging.info("SSL scan request received.")
        try:
            payload = request.get_json(force=True)
            designated_queue = flask_app.config["queues"].get("ssl", None)
            designated_queue.enqueue(
                dispatch_ssl,
                payload,
                retry=Retry(max=3, interval=[10, 30, 60]),
                job_timeout=86400,
                result_ttl=86400,
            )
            msg = "SSL scan request enqueued."
            logging.info(msg)
        except Exception as e:
            msg = f"An unexpected error occurred while attempting to enqueue SSL scan request: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg

    @flask_app.route("/dns", methods=["POST"])
    def enqueue_dns():
        """Enqueues a request received at /dns to the DNS Redis Queue

        :return: a message indicating whether the request was enqueued successfully.
        :rtype: str
        """
        logging.info("DNS scan request received.")
        try:
            payload = request.get_json(force=True)
            designated_queue = flask_app.config["queues"].get("dns", None)
            designated_queue.enqueue(
                dispatch_dns,
                payload,
                retry=Retry(max=3, interval=[10, 30, 60]),
                job_timeout=86400,
                result_ttl=86400,
            )
            msg = "DNS scan request enqueued."
            logging.info(msg)
        except Exception as e:
            msg = f"An unexpected error occurred while attempting to enqueue DNS scan request: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg

    return flask_app


app = Server(__name__)


def dispatch_https(payload):
    """Dispatches a scan request to be performed by the HTTPS scanner.

    Enqueued alongside the request to be executed by an RQ worker.

    :param dict payload: JSON request containing info about the domain to be scanned
    :return: A message indicating whether the request was dispatched successfully
    :rtype: str
    """
    logging.info("Dispatching HTTPS scan request")
    try:
        requests.post(HTTPS_URL, json=payload)
        return "Dispatched HTTPS scan request."
    except Exception as e:
        msg = f"An unexpected error occurred while attempting to dispatch HTTPS scan request: ({type(e).__name__}: {str(e)})"
        logging.error(msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg


def dispatch_ssl(payload):
    """Dispatches a scan request to be performed by the SSL scanner.

    Enqueued alongside the request to be executed by an RQ worker.

    :param dict payload: JSON request containing info about the domain to be scanned
    :return: A message indicating whether the request was dispatched successfully
    :rtype: str
    """
    logging.info("Dispatching SSL scan request")
    try:
        requests.post(SSL_URL, json=payload)
        return "Dispatched SSL scan request."
    except Exception as e:
        msg = f"An unexpected error occurred while attempting to dispatch SSL scan request: ({type(e).__name__}: {str(e)})"
        logging.error(msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg


def dispatch_dns(payload):
    """Dispatches a scan request to be performed by the DNS scanner.

    Enqueued alongside the request to be executed by an RQ worker.

    :param dict payload: JSON request containing info about the domain to be scanned.
    :return: A message indicating whether the request was dispatched successfully.
    :rtype: str
    """
    logging.info("Dispatching DNS scan request")
    try:
        requests.post(DNS_URL, json=payload)
        return "Dispatched DNS scan request."
    except Exception as e:
        msg = f"An unexpected error occurred while attempting to dispatch DNS scan request: ({type(e).__name__}: {str(e)})"
        logging.error(msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg
