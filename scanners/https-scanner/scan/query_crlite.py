import logging
import subprocess
import re


def query_crlite(pem_cert: bytes) -> bool:
    filename = "/tmp/temp.pem"
    f = open(filename, "w")
    f.write(pem_cert.decode("ascii"))
    f.close()

    find_query_crlite = subprocess.check_output(["which", "rust-query-crlite"])

    query_crlite_path = find_query_crlite.decode("ascii").splitlines()[0]
    if not query_crlite_path:
        FileNotFoundError("rust-query-crlite not found")

    completed = subprocess.run(
        [query_crlite_path, "-vv", "x509", filename],
        capture_output=True,
    )

    pattern = r'^(?:INFO|WARN|ERROR) - (\S*) (Good|Expired|NotCovered|NotEnrolled|Revoked)$'

    search_result = re.search(pattern, completed.stderr.decode("ascii"))

    if not search_result:
        raise ValueError(f"Certificate revocation status not found in rust_query_crlite output: {completed.stderr.decode('ascii')}")

    status = search_result.group(2)

    if status == "Good":
        return False
    elif status == "Expired":
        return False
    elif status == "NotCovered":
        raise ValueError("Cert issuer not covered by CRLite")
    elif status == "NotEnrolled":
        raise ValueError("Cert issuer not enrolled in CRLite")
    elif status == "Revoked":
        return True
    else:
        raise ValueError("Cert revocation status could not be checked")
