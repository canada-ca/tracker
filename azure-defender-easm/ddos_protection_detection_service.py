import csv
import time
from kusto_client import get_host_assets, host_has_ddos_protection


def export_to_csv(data, filename):
    with open(filename, "w") as csvfile:
        fieldnames = ["AssetName", "HasDDOSProtection"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for row in data:
            writer.writerow(row)


def ddos_protection_detection_service():
    host_assets = get_host_assets()
    print(f"Found {len(host_assets)} host assets")

    export_arr = []
    for host in host_assets:
        ddos_protection = host_has_ddos_protection(host["AssetName"])
        export_arr.append(
            {
                "AssetName": host["AssetName"],
                "HasDDOSProtection": ddos_protection,
            }
        )

    current_time = time.strftime("%Y%m%d-%H%M%S")
    export_to_csv(export_arr, f"ddos_protection_{current_time}.csv")


if __name__ == "__main__":
    print("DDOS Protection Detection Service started")
    ddos_protection_detection_service()
    print("DDOS Protection Detection Service done")
