import logging
import subprocess


def query_crlite(pem_cert: bytes) -> bool:
    """Checks if a PEM encoded certificate has been revoked with Mozilla's CRLite.

    Uses https://github.com/mozilla/moz_crlite_query and will raise an error if it is not installed.
    Will download a DB of revocations to ~/.crlite_db and update it when needed.

    :param bytes pem_cert: A PEM encoded X.509 certificate.
    :return: True if cert is revoked, else False.
    :rtype: bool
    :raises ValueError: if revocation status can't be checked
    """
    completed = subprocess.run(
        ["moz_crlite_query", "-"],
        input=pem_cert.decode("ascii"),
        capture_output=True,
        text=True,
    )
    # moz_crlite_query prints everything but results to stderr
    # Logging at debug level for now to monitor updates to DB
    logging.debug(completed.stderr)
    if "Revoked" in completed.stdout:
        return True
    elif "Valid" in completed.stdout:
        return False
    elif "Not Enrolled" in completed.stdout:
        raise ValueError("Cert issuer not enrolled in CRLite")
    else:
        raise ValueError("Cert revocation status could not be checked")
