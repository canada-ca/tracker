import os
import sys
import requests
import logging
from pshtt import cli
import kubernetes.client
#from flask import Flask, request
from kubernetes.client.rest import ApiException
from kncloudevents.kncloudevents import CloudeventsServer

# Configure API key authorization: BearerToken
configuration = kubernetes.client.Configuration()
#configuration.api_key['authorization'] = 'YOUR_API_KEY'
# Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
# configuration.api_key_prefix['authorization'] = 'Bearer'

# Create an instance of the API class
api_instance = kubernetes.client.AdmissionregistrationApi(kubernetes.client.ApiClient(configuration))
namespace = 'default'
#app = Flask(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def dispatch(event):

    logging.info("Event received\n")

    try:
        domain = event.Data()['domain']
        scan_id = event.Data()['scan_id']
        res = {}
        res["results"] = scan(scan_id, domain)
        res["scan_type"] = "https"
        logging.info(str(res)+'\n')
        #try:
            #body = kubernetes.client.V1Event(type="Normal", reason="RESULTS READY", message=str(res))
            #api_response = api_instance.create_namespaced_event(namespace, body)
            #print(api_response)
        #except ApiException as e:
            #print("Exception when calling CoreV1Api->create_namespaced_event: %s\n" % e)
            #return "Scan %s completed. Results queued for processing..." % scan_id
    except Exception as e:
        logging.error(str(e))

def scan(scan_id, domain):
    try:
        res_dict = cli.run([domain])
        return res_dict
    except Exception as e:
        logging.error(str(e))


client = CloudeventsServer(port=8080)
client.start_receiver(dispatch)

