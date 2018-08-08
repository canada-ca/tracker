# Install dependencies
apt-get update && apt-get install -y \
build-essential \
checkinstall \
libffi-dev \
libssl-dev \
locales \
python3-dev \
wget \
zlib1g-dev \

# Generate UTF-8 localte for publicsuffixlist install
locale-gen en_US.UTF-8

# Build and install Python3.6
cd /opt
wget https://www.python.org/ftp/python/3.6.6/Python-3.6.6.tgz
tar -xvf Python-3.6.6.tgz
cd Python-3.6.6
./configure && make && make install
