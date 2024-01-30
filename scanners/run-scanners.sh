#! /bin/bash

exitfn () {
    trap SIGINT
    pkill -xf "python3 service.py"
    exit
}

trap exitfn INT

gnome-terminal --working-directory=/home/kyle/PycharmProjects/tracker/scanners/dns-scanner --title='DNS Scanner' --name='DNS Scanner' -- bash -c "source .venv/bin/activate; python3 service.py"
gnome-terminal --working-directory=/home/kyle/PycharmProjects/tracker/scanners/dns-processor --title='DNS Processor' -- bash -c "source .venv/bin/activate; python3 service.py"
gnome-terminal --working-directory=/home/kyle/PycharmProjects/tracker/scanners/web-scanner --title='Web Scanner' -- bash -c "source .venv/bin/activate; python3 service.py"
gnome-terminal --working-directory=/home/kyle/PycharmProjects/tracker/scanners/web-processor --title='Web Processor' -- bash -c "source .venv/bin/activate; python3 service.py"

sleep infinity
