WORKDIR=${1:-"/opt/apps/tracker/"}
mkdir -p $WORKDIR
cd $WORKDIR

# Configure Locale so publicsuffixlist doesn't fail on installation
export LANG=en_US.UTF-8
export LANGUAGE=en_US:en
export LC_ALL=en_US.UTF-8

mkdir -p domain-scan && wget -q -O - https://api.github.com/repos/18F/domain-scan/tarball | tar xz --strip-components=1 -C domain-scan

python3.6 -m venv .venv
. .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install -r domain-scan/requirements.txt
pip install -r domain-scan/requirements-scanners.txt
pip install .
deactivate

tar -czvf tracker.tar.gz .venv domain-scan
rm -rf .venv domain-scan
