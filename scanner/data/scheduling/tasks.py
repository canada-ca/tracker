import subprocess
import json
import dkim
from celery import Celery
from celery.utils.log import get_task_logger
#from redis import Redis
#from redis import ConnectionPool
from kombu import Queue, Connection
from pymongo import MongoClient
from sslyze.synchronous_scanner import SynchronousScanner
from sslyze.server_connectivity_tester import ServerConnectivityTester, ServerConnectivityError
from sslyze.ssl_settings import TlsWrappedProtocolEnum
from sslyze.plugins.openssl_cipher_suites_plugin import Tlsv10ScanCommand

#_redis = Redis(host='localhost', port=6379)
#_redis.client_setname("track_redis")
app = Celery('tasks', backend='rpc://', broker='redis://localhost:6379/0')

app.conf.task_queues = (
    Queue('results'),
    Queue('https'),
    Queue('ssl'),
    Queue('dmarc'),
    Queue('dkim')
)

client = MongoClient('localhost', 27017)
db = client.track

_logger = get_task_logger(__name__)


@app.task(bind=True)
def scan_https(self, https_domain, scan_id):

    https_dict = {}
    domain = https_domain['domain']
    self.update_state(state="SCANNING")
    print(f'Scanning {domain} for https info...')
    #_install_req = subprocess.check_output("")

    _cmd = f'pshtt --json --output="result_dict{str(scan_id)}" {https_domain["domain"]} 2>/dev/null'
    _result = subprocess.check_output(_cmd, shell=True)

    print(f'Finished scanning {domain} for https info')

    with open(f'result_dict{str(scan_id)}') as json_file:
        https_dict = json.load(json_file)

    _cmd = f'sudo rm result_dict{str(scan_id)}'
    _rm = subprocess.check_output(_cmd, shell=True)

    #https_final = generate_https_tags(https_res)

    return https_dict, "https", scan_id


@app.task(bind=True)
def scan_ssl(self, ssl_domain, scan_id, cipher_list):

    # Comparing ciphers --
    #used_ciphers = {cipher for cipher in sslyze.get("Accepted Ciphers").split(', ')}
    #bad_ciphers = list(used_ciphers - accepted_ciphers)
    #signature_algorithm = sslyze.get("Signature Algorithm", "sha1")
    #acceptable_ciphers = not bad_ciphers

    ssl_dict = {}
    ssl_dict["domain"] = ssl_domain["domain"]
    domain = ssl_domain["domain"]
    self.update_state(state="SCANNING")
    print(f'Scanning {domain} for ssl info...')
    #_install_req = subprocess.check_output("")

    try:
        server_tester = ServerConnectivityTester(
            hostname=ssl_domain["domain"],
            port=443,
            tls_wrapped_protocol=TlsWrappedProtocolEnum.PLAIN_TLS
        )
        print(f'\nTesting connectivity with {server_tester.hostname}:{server_tester.port}...')
        server_info = server_tester.perform()
    except ServerConnectivityError as e:
        # Could not establish an SSL connection to the server
        raise RuntimeError(f'Could not connect to {e.server_info.hostname}: {e.error_message}')

    _cmd = Tlsv10ScanCommand()

    synchronous_scanner = SynchronousScanner()

    scan_result = synchronous_scanner.run_scan_command(server_info, _cmd)

    i=0
    used_ciphers = []
    for cipher in scan_result.accepted_cipher_list:
        print(f'    {cipher.name}')
        used_ciphers.append(cipher.name)
        i = i+1

    print(f'Finished scanning {domain} for ssl info')

    #https_final = generate_https_tags(https_res)

    bad_ciphers = []
    for cipher in used_ciphers:
        if cipher not in cipher_list:
            bad_ciphers.append(cipher)


    ssl_dict['accepted_ciphers'] = used_ciphers
    ssl_dict['bad_ciphers'] = bad_ciphers

    return ssl_dict, "ssl", scan_id


@app.task(bind=True)
def scan_dmarc(self, dmarc_domain, scan_id):
    dmarc_dict = {}
    spf_dict = {}
    domain = dmarc_domain["domain"]
    self.update_state(state="SCANNING")
    print(f'Scanning {domain} for dmarc info...')

    result = subprocess.run(['checkdmarc', domain], stdout=subprocess.PIPE).stdout.decode('utf-8')
    result_dict = json.loads(result)

    dmarc_dict["scan_id"] = scan_id
    dmarc_dict["domain"] = dmarc_domain["domain"]
    if result_dict["dmarc"].get("error", None):
        print(result_dict["dmarc"]["error"])
        dmarc_dict["valid"] = result_dict["dmarc"].get("valid", False)

    else:
        dmarc_dict["valid"] = result_dict["dmarc"].get("valid", False)
        dmarc_dict["location"] = result_dict["dmarc"].get("location", None)
        dmarc_dict["record"] = result_dict["dmarc"].get("record", None)
        dmarc_dict["p_policy"] = result_dict["dmarc"].get("tags", {}).get("p", {}).get("value")
        dmarc_dict["sp_policy"] = result_dict["dmarc"].get("tags", {}).get("sp", {}).get("value")
        dmarc_dict["pct"] = result_dict["dmarc"].get("tags", {}).get("pct", {}).get("value")

    # build SPF dict

    spf_dict["scan_id"] = scan_id
    spf_dict["domain"] = dmarc_domain["domain"]
    if result_dict["spf"].get("error", None):
        print(result_dict["spf"]["error"])
        spf_dict["valid"] = result_dict["spf"].get("valid", False)
    else:
        spf_dict["valid"] = result_dict["spf"].get("valid", False)
        spf_dict["lookups"] = result_dict["spf"].get("dns_lookups", None)
        spf_dict["record"] = result_dict["spf"].get("record", None)
        spf_dict["default"] = result_dict["spf"].get("all", None)

    print(f'Finished scanning {domain} for dmarc info')

    dmarc_res_dict = {1: dmarc_dict, 2: spf_dict}

    return dmarc_res_dict, "dmarc", scan_id


@app.task(bind=True)
def scan_dkim(self, dkim_domain, scan_id):

    #TODO Finish scanner by passing correct domain name for DKIM scanning
    #(e.g. selector1._domainkey.cyber.gc.ca)
    dkim_dict = {}
    domain = dkim_domain["domain"]
    domain = domain.encode('UTF-8')

    print(f'Scanning {domain} for dkim info...')

    output = dkim.load_pk_from_dns(domain)
    dkim_dict["scan_id"] = dkim_domain["scan_id"]
    dkim_dict["domain_id"] = dkim_domain["domain_id"]
    try:
        dkim_dict["record"] = str(output[0]["modulus"])
    except KeyError:
        pass
    try:
        dkim_dict["key_length"] = output[1]
    except KeyError:
        pass
    try:
        dkim_dict["key_type"] = output[2].decode('UTF-8')
    except KeyError:
        pass

    print(f'Finished scanning {domain} for dkim info')

    return dkim_dict, "dkim", scan_id


@app.task(bind=True)
def handle_results(self, result_dict, scan_type):

    self.update_state(state="PROCESSING")
    print(f'Processing {scan_type} data for {result_dict[0]["Domain"]}...')

    db.https_scans.create(result_dict)

    self.update_state(state="COMPLETE")

    return
