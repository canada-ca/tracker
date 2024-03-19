#! /bin/bash

exitfn () {
    trap SIGINT
    pkill -xf "python3 service.py"
    exit
}

trap exitfn INT

gnome-terminal --working-directory=$TRACKER_DIR/scanners/dns-scanner --title='DNS Scanner' --name='DNS Scanner' -- bash -c "source $TRACKER_SCANNER_VENV_DIRNAME/bin/activate; python3 service.py"
gnome-terminal --working-directory=$TRACKER_DIR/scanners/dns-processor --title='DNS Processor' -- bash -c "source $TRACKER_SCANNER_VENV_DIRNAME/bin/activate; python3 service.py"
gnome-terminal --working-directory=$TRACKER_DIR/scanners/web-scanner --title='Web Scanner' -- bash -c "source $TRACKER_SCANNER_VENV_DIRNAME/bin/activate; python3 service.py"
gnome-terminal --working-directory=$TRACKER_DIR/scanners/web-processor --title='Web Processor' -- bash -c "source $TRACKER_SCANNER_VENV_DIRNAME/bin/activate; python3 service.py"

sleep infinity
