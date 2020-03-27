import os
import sys
import json
import logging
import jwt
from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from models import Dmarc_scans, Dkim_scans, Spf_scans, Https_scans, Ssl_scans, Mx_scans, Spf_scans, Scans
from database import *
from utils import *
from datetime import datetime
from cipher_conversion import TLS_OPENSSL_TO_RFC_NAMES_MAPPING, SSLV2_OPENSSL_TO_RFC_NAMES_MAPPING

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

MIN_HSTS_AGE = 31536000 # one year


@app.route('/receive', methods=['GET', 'POST'])
def receive():

    try:

        # TODO Replace secret
        decoded_payload = jwt.decode(
            request.get_data(),
            "test_jwt",
            algorithm=['HS256']
        )

        result_dict = formatted_dictionary(decoded_payload["results"])
        scan_type = decoded_payload["scan_type"]
        scan_id = decoded_payload["scan_id"]

        res = process_results(result_dict, scan_type, scan_id)

        logging.info(res["info"])
        return res["info"]

    except Exception as e:
        logging.error('Failed: %s\n' % str(e))
        return "Failed to process results"


def process_results(results, scan_type, scan_id):

    try:
        report = {}

        if scan_type == "dmarc":
            if results is not None:
                report = {"dmarc": results["dmarc"], "spf": results["spf"], "mx": results["mx"]}
            else:
                report = {"dmarc": {"missing": True}, "spf": {"missing": True},  "mx": {"missing": True}}

        elif scan_type == "dkim":
            if results is not None:
                report = results
            else:
                report = {"missing": True}

        elif scan_type == "https":
            if results is None:
                report = {"missing": True}

            else:

                # Assumes that HTTPS would be technically present, with or without issues
                if results["Downgrades HTTPS"]:
                    https = "Downgrades HTTPS"  # No
                else:
                    if results["Valid HTTPS"]:
                        https = "Valid HTTPS"  # Yes
                    elif (results["HTTPS Bad Chain"] and not results["HTTPS Bad Hostname"]
                    ):
                        https = "Bad Chain"  # Yes
                    else:
                        https = "Bad Hostname"  # No

                report["implementation"] = https

                # Is HTTPS enforced?

                if https == ("Downgrades HTTPS" or "Bad Hostname"):
                    behavior = "Not Enforced"  # N/A

                else:

                    # "Strict" means HTTP immediately redirects to HTTPS,
                    # *and* that HTTP eventually redirects to HTTPS.
                    #
                    # Since a pure redirector domain can't "default" to HTTPS
                    # for itself, we'll say it "Enforces HTTPS" if it immediately
                    # redirects to an HTTPS URL.
                    if results["Strictly Forces HTTPS"] and (results["Defaults to HTTPS"] or results["Redirect"]):
                        behavior = "Strict"  # Yes (Strict)

                    # "Moderate" means HTTP eventually redirects to HTTPS.
                    elif not results["Strictly Forces HTTPS"] and results["Defaults to HTTPS"]:
                        behavior = "Moderate"  # Yes

                    # Either both are False, or just 'Strict Force' is True,
                    # which doesn't matter on its own.
                    # A "present" is better than a downgrade.
                    else:
                        behavior = "Weak"  # Present (considered 'No')

                report["enforced"] = behavior

                ###
                # Characterize the presence and completeness of HSTS.

                if results["HSTS Max Age"]:
                    hsts_age = int(results["HSTS Max Age"])
                else:
                    hsts_age = None

                # Otherwise, without HTTPS there can be no HSTS for the domain directly.
                if https is "Downgrades HTTPS" or "Bad Hostname":
                    hsts = "No HSTS"  # N/A (considered 'No')

                else:

                    # HSTS is present for the canonical endpoint.
                    if results["HSTS"] and hsts_age is not None:

                        # Say No for too-short max-age's, and note in the extended details.
                        if hsts_age >= MIN_HSTS_AGE:
                            hsts = "HSTS Fully Implemented"  # Yes, directly
                        else:
                            hsts = "HSTS Max Age Too Short"  # No
                    else:
                        hsts = "No HSTS"  # No

                # Separate preload status from HSTS status:
                #
                # * Domains can be preloaded through manual overrides.
                # * Confusing to mix an endpoint-level decision with a domain-level decision.
                if results["HSTS Preloaded"]:
                    preloaded = "HSTS Preloaded"  # Yes
                elif results["HSTS Preload Ready"]:
                    preloaded = "HSTS Preload Ready"  # Ready for submission
                else:
                    preloaded = "HSTS Not Preloaded"  # No

                # Certificate info
                if results["HTTPS Expired Cert"]:
                    expired = True
                else:
                    expired = False

                if results["HTTPS Self Signed Cert"]:
                    self_signed = True
                else:
                    self_signed = False

                report["hsts"] = hsts
                report["hsts_age"] = hsts_age
                report["preload_status"] = preloaded
                report["expired_cert"] = expired
                report["self_signed_cert"] = self_signed

        elif scan_type == "ssl":

            # Get cipher/protocol data via sslyze for a host.

            if results is None:
                report = {"missing": True}

                report["sslv2"] = False
                report["sslv3"] = False
                report["tlsv1_0"] = False
                report["tlsv1_1"] = False
                report["tlsv1_2"] = False
                report["tlsv1_3"] = False
                report["bod_crypto"] = False
                report["rc4"] = False
                report["3des"] = False
                report["used_ciphers"] = []
                report["good_cert"] = False
                report["signature_algorithm"] = None
                report["starttls"] = False
                report["heartbleed"] = False
                report["openssl_ccs_injection"] = False

            else:
                ###
                # BOD 18-01 (cyber.dhs.gov) cares about SSLv2, SSLv3, RC4, and 3DES.
                any_rc4 = results["rc4"]

                any_3des = results["3des"]

                ###
                # ITPIN cares about usage of TLS 1.0/1.1/1.2

                for version in ["SSLV2", "SSLV3", "TLSV1", "TLSV1_1", "TLSV1_2", "TLSV1_3"]:
                    if version == results["TLS"]["supported"]:
                        report[version] = True
                    else:
                        report[version] = False

                used_ciphers = {cipher for cipher in results["TLS"]["accepted_cipher_list"]}
                signature_algorithm = results["signature_algorithm"]

                if any([any_rc4, any_3des, report["SSLV2"], report["SSLV3"], report["TLSV1"], report["TLSV1_1"]]):
                    bod_crypto = False
                else:
                    bod_crypto = True

                starttls = results["starttls"]

                heartbleed = results.get("is_vulnerable_to_heartbleed", False)
                ccs_injection = results.get("is_vulnerable_to_ccs_injection", False)

                if results["signature_algorithm"] is "SHA256" or "SHA384" or "AEAD":
                    good_cert = True
                else:
                    good_cert = False

                report["bod_crypto"] = bod_crypto
                report["rc4"] = any_rc4
                report["3des"] = any_3des
                report["used_ciphers"] = used_ciphers
                report["acceptable_certificate"] = good_cert
                report["signature_algorithm"] = signature_algorithm
                report["starttls"] = starttls

                report["heartbleed"] = heartbleed
                report["openssl_ccs_injection"] = ccs_injection

    except Exception as e:
        return {"status": False, "info": str(e)}

    finalized_report = json.JSONEncoder().encode(str(report))

    insert(finalized_report, scan_type, scan_id)

    return {"status": True, "info": "Results processed successfully"}


def insert(report, scan_type, scan_id):

    scan = Scans.query.filter(Scans.id == scan_id).first()

    try:

        if scan_type is "https":
            result_obj = Https_scans(https_scan={"https": report}, https_flagged_scan=scan)
            db.session.add(result_obj)
        elif scan_type is "ssl":
            result_obj = Ssl_scans(ssl_scan={"ssl": report}, ssl_flagged_scan=scan)
            db.session.add(result_obj)
        elif scan_type is "dmarc":
            dmarc_obj = Dmarc_scans(dmarc_scan={"dmarc": report["dmarc"]}, dmarc_flagged_scan=scan)
            mx_obj = Mx_scans(mx_scan={"mx": report["mx"]}, mx_flagged_scan=scan)
            spf_obj = Spf_scans(spf_scan={"spf": report["spf"]}, spf_flagged_scan=scan)
            db.session.add(dmarc_obj)
            db.session.add(mx_obj)
            db.session.add(spf_obj)
        elif scan_type is "dkim":

            previous_scans = Scans.query.filter(
                Scans.domain_id == scan.domain_id
            )

            update_recommended = False

            for previous_scan in previous_scans:
                if (scan.scan_date - previous_scan.scan_date).TotalDays >= 365:
                    historical_dkim = Dkim_scans.query.filter(Dkim_scans.id == previous_scan.id)
                    if report["public_key_modulus"] == historical_dkim.dkim_scan["dkim"]["public_key_modulus"]:
                        update_recommended = True

            report["update-recommended"] = update_recommended
            result_obj = Dkim_scans(dkim_scan={"dkim": report}, dkim_flagged_scan=scan)
            db.session.add(result_obj)

            db.session.commit()

    except Exception as e:
        db.session.rollback()
        db.session.flush()
        logging.error('Failed database insertion: %s\n' % str(e))


if __name__ == "__main__":
    # Port number defaults to 8080, can be configured within corresponding deployment.yaml
    app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
