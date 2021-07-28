#!/bin/sh

service redis-server start
sleep 5
rq worker https dns ssl &
sleep 1
rq worker https dns ssl &
sleep 1
rq worker https dns ssl &
sleep 1
rq worker https dns ssl &
sleep 1
rq worker ssl dns https &
sleep 1
rq worker ssl dns https &
sleep 1
rq worker ssl dns https &
sleep 1
rq worker ssl dns https &
sleep 1
rq worker dns ssl https &
sleep 1
rq worker dns ssl https &
sleep 1
rq worker dns ssl https &
sleep 1
rq worker dns ssl https &
sleep 1
gunicorn scan_queue:app -w 4 --timeout 300
