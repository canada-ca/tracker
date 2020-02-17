import os
import subprocess
import json
from flask import Flask, request
from datetime import datetime

app = Flask(__name__)

@app.route('/enqueue', methods=['GET', 'POST'])
def enqueue():

    try:
        result_dict = request.json["results"]
        scan_type = request.json["scan_type"]

        res = process_results(result_dict, scan_type)

        # Succeeded
        if res[1] is True:
            return res[0]
        # Failed
        else:
            raise Exception(res[0])

    except Exception as e:
        return str(e)

def process_results(result_dict, scan_type):

    try:

        # do stuff

        return "Finished", True

    except Exception as e:
        return str(e), False


if __name__ == "__main__":
    # Port number defaults to 8080, can be configured within corresponding service.yaml
    app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
