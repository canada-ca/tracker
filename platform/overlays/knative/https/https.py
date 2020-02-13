import os
import subprocess
import json
from celery import Celery
from celery.utils.log import get_task_logger
from kombu import Queue, Connection
from flask import Flask

app_server = Flask(__name__)

app = Celery('tasks', backend='rpc://', broker='redis://localhost:6379/0')

app.conf.task_queues = (
   Queue('https')
)


@app_server.route('/https')
@app.task(bind=True)
def scan():

   https_dict = {}
   https_domain = os.environ.get('https_domain')
   domain = https_domain['domain']
   scan_id = os.environ.get('scan_id')

   _cmd = f'pshtt --json --output="result_dict{str(scan_id)}" {domain} 2>/dev/null'
   _result = subprocess.check_output(_cmd, shell=True)

   print(f'Finished scanning {domain} for https compliance')

   with open(f'result_dict{str(scan_id)}') as json_file:
      https_dict = json.load(json_file)

   _cmd = f'sudo rm result_dict{str(scan_id)}'
   _rm = subprocess.check_output(_cmd, shell=True)

   return https_dict, "https", scan_id


if __name__ == "__main__":
   # Port number defaults to 8080, can be configured within corresponding service.yaml
   app_server.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))