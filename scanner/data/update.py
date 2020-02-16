import subprocess
import time

from models import *
import logger
from scheduling import tasks
from datetime import datetime

LOGGER = logger.get_logger(__name__)

_s = []
_r = []

def update(connection: Connection):

    # 1c. Scan domains for all types of things.
    LOGGER.info("Scanning domains.")
    dispatch(connection)
    LOGGER.info("Scan of domains complete.")


def dispatch(connection: Connection):

    # Result tasks ready
    res_count = 0
    # Scan tasks ready
    scan_count = 0
    # Total domains
    domain_count = 0

    cipher_list = []

    for ciph in connection.get(Ciphers):
        cipher_list.append(ciph.cipher_type)

    _ssl_worker = "ssl_worker_" + str(datetime.timestamp(datetime.utcnow())) + "@%h"
    subprocess.Popen(["celery", "-A", "scheduling.tasks", "worker", "--loglevel=INFO", "-n", _ssl_worker, "-Q", "ssl"])

    _dmarc_worker = "dmarc_worker_" + str(datetime.timestamp(datetime.utcnow())) + "@%h"
    subprocess.Popen(["celery", "-A", "scheduling.tasks", "worker", "--loglevel=INFO", "-n", _dmarc_worker, "-Q", "dmarc"])

    _dkim_worker = "dkim_worker_" + str(datetime.timestamp(datetime.utcnow())) + "@%h"
    subprocess.Popen(["celery", "-A", "scheduling.tasks", "worker", "--loglevel=INFO", "-n", _dkim_worker, "-Q", "dkim"])

    _results_worker = "results_worker_" + str(datetime.timestamp(datetime.utcnow())) + "@%h"
    subprocess.Popen(["celery", "-A", "scheduling.tasks", "worker", "--loglevel=INFO", "-n", _results_worker, "-Q", "results"])

    for dom in connection.get(Domains):

        domain = to_json(dom)
        domain_count = domain_count + 1

        # Iterate through currently dispatched scan tasks to check for early completion
        for s in _s:
            if s.ready():
                _results, _type, _id = s.get()
                scan_count = scan_count + 1
                # Append AsyncResult to list and enqueue result-handling task
                _r.append(tasks.handle_results.apply_async(args=[_results, _type], task_id=datetime.timestamp(datetime.utcnow()), queue='ready'))
                # List comprehension to perform in-place removal of task
                _s[:] = [_scan for _scan in _s if _scan is not s]

        if domain['scan_https']:
            # Append AsyncResult to list and enqueue scan task
            scan_id = datetime.timestamp(datetime.utcnow())
            _s.append(tasks.scan_https.apply_async(args=[domain, scan_id], task_id=scan_id, queue='https'))

        if domain['scan_ssl']:
            # Append AsyncResult to list and enqueue scan task
            scan_id = datetime.timestamp(datetime.utcnow())
            _s.append(tasks.scan_ssl.apply_async(args=[domain, scan_id, cipher_list], task_id=scan_id, queue='ssl'))

        if domain['scan_dmarc']:
            # Append AsyncResult to list and enqueue scan task
            scan_id = datetime.timestamp(datetime.utcnow())
            _s.append(tasks.scan_dmarc.apply_async(args=[domain, scan_id], task_id=scan_id, queue='dmarc'))

        if domain['scan_dkim']:
            # Append AsyncResult to list and enqueue scan task
            scan_id = datetime.timestamp(datetime.utcnow())
            _s.append(tasks.scan_dkim.apply_async(args=[domain, scan_id], task_id=scan_id, queue='dkim'))


    # Wait for all tasks to finish and enqueue result-handling tasks
    while scan_count is not domain_count:
        for s in _s:
            if s.ready():
                _results, _type, _id = s.get()
                scan_count = scan_count + 1
                # Append AsyncResult to list and enqueue result-handling task
                _r.append(tasks.handle_results.apply_async(args=[_results, _type], task_id=datetime.timestamp(datetime.utcnow()), queue='ready'))
                # List comprehension to perform in-place removal of task
                _s[:] = [_scan for _scan in _s if _scan is not s]

    # Wait until scan results for all domains have been retrieved and inserted
    while res_count is not domain_count:
        for r in _r:
            if r.ready():
                _results, _type, _id = r.get()
                res_count = res_count + 1
                # List comprehension to perform in-place removal of task
                _r[:] = [_result for _result in _r if _result is not r]

    time.sleep(1)
    tasks.app.control.shutdown()


# Converts 'Domain' object to a JSON-Serializable object
def to_json(domain):
    json_domain = {'id': domain.id,
                   'domain': domain.domain,
                   'last_run': domain.last_run,
                   'scan_spf': domain.scan_spf,
                   'scan_dmarc': domain.scan_dmarc,
                   'scan_dmarc_psl': domain.scan_dmarc_psl,
                   'scan_mx': domain.scan_mx,
                   'scan_dkim': domain.scan_dkim,
                   'scan_https': domain.scan_https,
                   'scan_ssl': domain.scan_ssl,
                   'dmarc_phase': domain.dmarc_phase,
                   'organization_id': domain.organization_id
                   }

    return json_domain


# Utils function for shelling out.
def shell_out(command, env=None, debug=False):
    try:
        LOGGER.info("[cmd] %s", str.join(" ", command))
        if debug:
            shell_cmd = str.join(" ", command)
            response = subprocess.check_output(shell_cmd, shell=True, env=env)
        else:
            response = subprocess.check_output(command, shell=False, env=env)
        output = str(response, encoding="UTF-8")
        LOGGER.info(output)
        return output
    except subprocess.CalledProcessError:
        LOGGER.critical("Error running %s.", str(command))
        exit(1)
        return None
