#!/bin/sh

service redis-server start
sleep 5
rq worker https &
sleep 1
rq worker ssl &
sleep 1
rq worker dns &
sleep 1
gunicorn scan_queue:app -w 4 --timeout 300
