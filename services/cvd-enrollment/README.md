# CVD Enrollment Service

This service manages the enrollment of domains into the CVD (Coordinated Vulnerability Disclosure) program and synchronizes domain assets with HackerOne.

## Overview

- **Synchronizes enrolled domains from Tracker with HackerOne assets**
- **Creates new assets in HackerOne for newly enrolled domains**
- **Archives assets in HackerOne that are no longer enrolled**

## Files

- [`main.py`](services/cvd-enrollment/main.py): Core logic for domain enrollment, asset creation, and archiving.
- [`hackerone.py`](services/cvd-enrollment/hackerone.py): Handles HackerOne API interactions for asset management.

## How It Works

1. **Fetches enrolled domains** from the Tracker database using ArangoDB.
2. **Retrieves current assets** from HackerOne via API.
3. **Creates new assets** in HackerOne for domains enrolled in CVD but not present in HackerOne.
4. **Archives assets** in HackerOne that are no longer enrolled in CVD.

## Environment Variables

- `LOGGER_LEVEL`: Logging verbosity (default: INFO)
- `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_URL`: ArangoDB credentials
- `API_USERNAME`, `API_TOKEN`, `ORG_ID`: HackerOne API credentials

## Usage

Run the service:

```bash
python main.py
```

## Logging

- DEBUG/INFO logs to stdout
- WARNING and above logs to stderr

## Notes

- Re-adding archived assets is not currently supported by the HackerOne API.
- Existing HackerOne assets not in Tracker are not handled yet (see TODOs in [`main.py`](services/cvd-enrollment/main.py:93)).

## Requirements

- Python 3.10+
- `arango`, `python-dotenv`, `requests`

## License

See project root for license information.
