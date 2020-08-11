import os
import sys
import time
import requests
import logging
import dill
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

PROCESSOR_URL = "http://result-processor.scanners.svc.cluster.local"

redis = Redis(connection_pool=pool)
https_queue = Queue("https", connection=redis)
ssl_queue = Queue("ssl", connection=redis)
dns_queue = Queue("dns", connection=redis)

default_queues = {"https": https_queue,
                  "ssl": ssl_queue,
                  "dns": dns_queue}

def Server(process_name, server_client=requests, queues=default_queues):

    flask_app = Flask(process_name)
    flask_app.config["client"] = server_client
    flask_app.config["queues"] = queues
    return flask_app

app = Server(__name__)


def dispatch_https(payload, client_str):
    logging.info("Dispatching HTTPS result processing request")
    client = dill.loads(client_str)
    try:
        client.post(PROCESSOR_URL, json=payload)
        return "Dispatched HTTPS result processing request."
    except Exception as e:
        msg = f"An unexpected error occurred while attempting to dispatch HTTPS result processing request: ({type(e).__name__}: {str(e)})"
        logging.error(msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg

def dispatch_ssl(payload, client_str):
    logging.info("Dispatching SSL result processing request")
    client = dill.loads(client_str)
    try:
        client.post(PROCESSOR_URL, json=payload)
        return "Dispatched SSL result processing request."
    except Exception as e:
        msg = f"An unexpected error occurred while attempting to dispatch SSL result processing request: ({type(e).__name__}: {str(e)})"
        logging.error(msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg

def dispatch_dns(payload, client_str):
    logging.info("Dispatching DNS result processing request")
    client = dill.loads(client_str)
    try:
        client.post(PROCESSOR_URL, json=payload)
        return "Dispatched DNS result processing request."
    except Exception as e:
        msg = f"An unexpected error occurred while attempting to dispatch DNS result processing request: ({type(e).__name__}: {str(e)})"
        logging.error(msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
        return msg

@app.route('/https', methods=['POST'])
def enqueue_https():
    logging.info("HTTPS result processing request received.")
    try:
        payload = request.get_json(force=True)
        designated_queue = app.config["queues"].get("https", None)
        designated_queue.enqueue(dispatch_https, payload, dill.dumps(app.config["client"]), retry=Retry(max=3), job_timeout=86400, result_ttl=86400)
        msg = "HTTPS result processing request enqueued."
        logging.info(msg)
    except Exception as e:
        msg = f"An unexpected error occurred while attempting to enqueue HTTPS result processing request: ({type(e).__name__}: {str(e)})"
        logging.error(msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
    return msg

@app.route('/ssl', methods=['POST'])
def enqueue_ssl():
    logging.info("SSL result processing request received.")
    try:
        payload = request.get_json(force=True)
        designated_queue = app.config["queues"].get("ssl", None)
        designated_queue.enqueue(dispatch_ssl, payload, dill.dumps(app.config["client"]), retry=Retry(max=3), job_timeout=86400, result_ttl=86400)
        msg = "SSL result processing request enqueued."
        logging.info(msg)
    except Exception as e:
        msg = f"An unexpected error occurred while attempting to enqueue SSL result processing request: ({type(e).__name__}: {str(e)})"
        logging.error(msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
    return msg

@app.route('/dns', methods=['POST'])
def enqueue_dns():
    logging.info("DNS result processing request received.")
    try:
        payload = request.get_json(force=True)
        designated_queue = app.config["queues"].get("dns", None)
        designated_queue.enqueue(dispatch_dns, payload, dill.dumps(app.config["client"]), retry=Retry(max=3), job_timeout=86400, result_ttl=86400)
        msg = "DNS result processing request enqueued."
        logging.info(msg)
    except Exception as e:
        msg = f"An unexpected error occurred while attempting to enqueue DNS result processing request: ({type(e).__name__}: {str(e)})"
        logging.error(msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
    return msg
