#! /bin/bash

exitfn () {
    trap SIGINT
    pkill -xf "python3 service.py"
    exit
}

trap exitfn INT

if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --working-directory=$TRACKER_DIR/scanners/dns-scanner --title='DNS Scanner' --name='DNS Scanner' -- bash -c "source $TRACKER_SCANNER_VENV_DIRNAME/bin/activate; python3 service.py"
    gnome-terminal --working-directory=$TRACKER_DIR/scanners/dns-processor --title='DNS Processor' -- bash -c "source $TRACKER_SCANNER_VENV_DIRNAME/bin/activate; python3 service.py"
    gnome-terminal --working-directory=$TRACKER_DIR/scanners/web-scanner --title='Web Scanner' -- bash -c "source $TRACKER_SCANNER_VENV_DIRNAME/bin/activate; python3 service.py"
    gnome-terminal --working-directory=$TRACKER_DIR/scanners/web-processor --title='Web Processor' -- bash -c "source $TRACKER_SCANNER_VENV_DIRNAME/bin/activate; python3 service.py"
elif command -v konsole &> /dev/null; then
    konsole --workdir=$TRACKER_DIR/scanners/dns-scanner -p tabtitle='DNS Scanner' --new-tab -e bash -c "source $TRACKER_SCANNER_VENV_DIRNAME/bin/activate; python3 service.py" &
    konsole --workdir=$TRACKER_DIR/scanners/dns-processor -p tabtitle='DNS Processor' -e bash -c "source $TRACKER_SCANNER_VENV_DIRNAME/bin/activate; python3 service.py" &
    konsole --workdir=$TRACKER_DIR/scanners/web-scanner -p tabtitle='Web Scanner' -e bash -c "source $TRACKER_SCANNER_VENV_DIRNAME/bin/activate; python3 service.py" &
    konsole --workdir=$TRACKER_DIR/scanners/web-processor -p tabtitle='Web Processor' -e bash -c "source $TRACKER_SCANNER_VENV_DIRNAME/bin/activate; python3 service.py" &
else
    echo "No terminal emulator found"
    exit 1
fi

sleep infinity
