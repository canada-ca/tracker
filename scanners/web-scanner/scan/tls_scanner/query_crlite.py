import re
import subprocess
import tempfile
import os


def query_crlite(pem_cert: bytes) -> tuple[bool, str]:
    fd, filename = tempfile.mkstemp(suffix=".pem")
    try:
        with os.fdopen(fd, "w") as f:
            f.write(pem_cert.decode("ascii"))

        find_query_crlite = subprocess.check_output(["which", "rust-query-crlite"])

        query_crlite_path = find_query_crlite.decode("ascii").splitlines()[0]
        if not query_crlite_path:
            raise FileNotFoundError("rust-query-crlite not found")

        completed = subprocess.run(
            [query_crlite_path, "x509", filename],
            capture_output=True,
        )

        pattern = r'^INFO - (\S*) (Good|Expired|NotCovered|NotEnrolled|Revoked)$'

        search_result = re.search(pattern, completed.stderr.decode("ascii"), re.MULTILINE)

        if not search_result:
            raise ValueError(f"Certificate revocation status not found in rust_query_crlite output: {completed.stderr.decode('ascii')}")

        match search_result.group(2):
            case "Good":
                return True, "Good"
            case "Expired":
                return True, "Expired"
            case "NotCovered":
                return True, "NotCovered"
            case "NotEnrolled":
                return True, "NotEnrolled"
            case "Revoked":
                return False, "Revoked"
            case _:
                raise ValueError("Unknown status result")
    finally:
        os.unlink(filename)
