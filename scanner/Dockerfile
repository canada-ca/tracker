FROM python:3.6

ENV DOMAIN_HOME /opt/scan/domain-scan
ENV TRACKER_HOME /opt/scan/tracker
ENV DOMAIN_SCAN_PATH $DOMAIN_HOME/scan
ENV DOMAIN_GATHER_PATH $DOMAIN_HOME/gather

# Pull down the domain-scan repo to /opt/scan/domain-scan
RUN mkdir -p $DOMAIN_HOME && wget -q -O - https://api.github.com/repos/cds-snc/domain-scan/tarball | tar xz --strip-components=1 -C $DOMAIN_HOME

# Copy required source and package files
COPY MANIFEST.in $TRACKER_HOME/MANIFEST.in
COPY setup.py $TRACKER_HOME/setup.py 
COPY data $TRACKER_HOME/data

# Setup environment
RUN pip install $TRACKER_HOME/.
RUN pip install -r $DOMAIN_HOME/requirements.txt
RUN pip install -r $DOMAIN_HOME/requirements-scanners.txt

# Set entrypoint
CMD [ "/bin/bash", "-ce", "cd /opt/scan/tracker && tracker run" ]