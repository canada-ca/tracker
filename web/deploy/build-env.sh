WORKDIR=${1:-"/opt/apps/track-web"}
mkdir -p $WORKDIR
cd $WORKDIR
python3 -m venv .venv
. .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
tar -czvf track-web.tar.gz .venv track
rm -rf .venv
