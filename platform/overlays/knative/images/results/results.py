import os
import sys
import subprocess
import json
import logging
from flask import Flask, request
from datetime import datetime

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

app = Flask(__name__)

@app.route('/dispatch', methods=['GET', 'POST'])
def dispatch():

    try:
        result_dict = request.json["results"]
        scan_type = request.json["scan_type"]

        res = process_results(result_dict, scan_type)

        # Succeeded
        if res[1] is True:
            logging.info('Succeeded\n')
        # Failed
        else:
            raise Exception(res[0])

    except Exception as e:
        logging.error('Failed: %s\n' % str(e))

def process_results(result_dict, scan_type):

    try:

        # do stuff

        return "Finished", True

    except Exception as e:
        return str(e), False


if __name__ == "__main__":
    # Port number defaults to 8080, can be configured within corresponding deployment.yaml
    app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
