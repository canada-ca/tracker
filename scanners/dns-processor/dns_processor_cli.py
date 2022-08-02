import argparse
import json
import logging
import sys


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Process results from DNS scan.')
    parser.add_argument('--input-file', '-i',
                        type=argparse.FileType('r'),
                        default=sys.stdin,
                        help='Input file containing results to process.')
    parser.add_argument('-v', action='count', help='enable verbose logging', default=0)

    args = parser.parse_args()

    from dns_processor.dns_processor import process_results

    log_levels = ["WARNING", "INFO", "DEBUG"]
    log_level = log_levels[min(args.v, len(log_levels) - 1)]

    logging.basicConfig(stream=sys.stderr, level=getattr(logging, log_level))

    res = process_results(json.loads(args.input_file.read()))
    print(json.dumps(res, indent=4))
