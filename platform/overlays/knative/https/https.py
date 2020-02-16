import os
import subprocess
import json
from pshtt import cli
#from celery import Celery
#from celery.utils.log import get_task_logger
#from kombu import Queue, Connection
from flask import Flask, request
#from pshtt import *
from datetime import datetime

app = Flask(__name__)

#app_queue = Celery('tasks', backend='rpc://', broker='redis://localhost:6379/0')

#app_queue.conf.task_queues = (
#   Queue('https')
#)

@app.route('/enqueue', methods=['GET', 'POST'])
def enqueue():

   try:
      body = request.json
      domain = body['https_domain']
      scan_id = body['scan_id']
      #s = scan.apply_async(args=[domain, scan_id], task_id=scan_id, queue='https')
      res = scan(scan_id, domain)
      return str(res)
   except Exception as e:
      return str(e)

#@app_queue.task(bind=True)
#self?
def scan(scan_id, domain):

   try:
      #https_dict = {}

      res_dict = cli.run(domain)

      #_cmd = "psht -j --output='result_dict%s' %s" % (body['scan_id'], body['https_domain'])
      #r = subprocess.check_output(_cmd, shell=True)
      #with open(f'result_dict{str(body["scan_id"])}') as json_file:
      #   https_dict = json.load(json_file)

      #_cmd = f'sudo rm result_dict{str(scan_id)}'
      #_rm = subprocess.check_output(_cmd, shell=True)

      #return https_dict, "https", scan_id

      return res_dict

   except Exception as e:
      return str(e)


if __name__ == "__main__":
   # Port number defaults to 8080, can be configured within corresponding service.yaml
   app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))

   # Dispatch celery worker to task queue
   #_https_worker = "https_worker_" + str(datetime.timestamp(datetime.utcnow())) + "@%h"
   #subprocess.Popen(
   #   ["celery", "-A", "https", "worker", "--loglevel=INFO", "-n", _https_worker, "-Q", "https"]
   #)