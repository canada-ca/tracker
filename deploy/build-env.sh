WORKDIR=${1:-"/home/DEV.T1.TBS-SCT.GC.CA/dsamojle-ps/"}
mkdir -p $WORKDIR
cd $WORKDIR
python3 -m venv .venv
mkdir -p domain-scan && wget -q -O - https://api.github.com/repos/18F/domain-scan/tarball | tar xz --strip-components=1 -C domain-scan

. .venv/bin/activate
pip install wheel
pip install -r requirements.txt
pip install -r domain-scan/requirements.txt
pip install -r domain-scan/requirements-scanners.txt
pip install .
tar -czvf tracker.tar.gz .venv domain-scan
rm -rf .venv domain-scan
