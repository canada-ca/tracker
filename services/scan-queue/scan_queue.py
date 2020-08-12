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
pool = ConnectionPool(host='127.0.0.1', port=6379, db=0)

HTTPS_URL = "http://https-scanner.scanners.svc.cluster.local"
SSL_URL = "http://ssl-scanner.scanners.svc.cluster.local"
DNS_URL = "http://dns-scanner.scanners.svc.cluster.local"

redis = Redis(connection_pool=pool)
https_queue = Queue("https", connection=redis)
ssl_queue = Queue("ssl", connection=redis)
dns_queue = Queue("dns", connection=redis)

default_queues = {"https": https_queue,
                  "ssl": ssl_queue,
                  "dns": dns_queue}


def Server(process_name, queues=default_queues):

    flask_app = Flask(process_name)
    flask_app.config["queues"] = queues

    @flask_app.route('/https', methods=['POST'])
    def enqueue_https():
        logging.info("HTTPS scan request received.")
        try:
            payload = request.get_json(force=True)
            designated_queue = flask_app.config["queues"].get("https", None)
            designated_queue.enqueue(dispatch_https, payload, retry=Retry(max=3), job_timeout=86400, result_ttl=86400)
            msg = "HTTPS scan request enqueued."
            logging.info(msg)
        except Exception as e:
            msg = f"An unexpected error occurred while attempting to enqueue HTTPS scan request: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg

    @flask_app.route('/ssl', methods=['POST'])
    def enqueue_ssl():
        logging.info("SSL scan request received.")
        try:
            payload = request.get_json(force=True)
            designated_queue = flask_app.config["queues"].get("ssl", None)
            designated_queue.enqueue(dispatch_ssl, payload, retry=Retry(max=3), job_timeout=86400, result_ttl=86400)
            msg = "SSL scan request enqueued."
            logging.info(msg)
        except Exception as e:
            msg = f"An unexpected error occurred while attempting to enqueue SSL scan request: ({type(e).__name__}: {str(e)})"
            logging.error(msg)
            logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg


    @flask_app.route('/dns', methods=['POST'])
    def enqueue_dns():
        logging.info("DNS scan request received.")
        try:
            payload = request.get_json(force=True)
            designated_queue = flask_app.config["queues"].get("ssl", None)
            designated_queue.enqueue(dispatch_dns, payload, retry=Retry(max=3), job_timeout=86400, result_ttl=86400)
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
    logging.info("Dispatching DNS scan request")
    try:
        requests.post(DNS_URL, json=payload)
        return "Dispatched DNS scan request."
    except Exception as e:
        msg = f"An unexpected error occurred while attempting to dispatch DNS scan request: ({type(e).__name__}: {str(e)})"
        logging.error(msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg
