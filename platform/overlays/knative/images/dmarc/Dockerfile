FROM python:3-slim AS prep-image

# Copy local code.
WORKDIR /dmarc
COPY . ./

# Install dependancies.
RUN pip3 install --user Flask waitress

RUN pip3 install --user checkdmarc
RUN pip3 install --user requests
RUN pip3 install --user PyJWT
RUN pip3 install --user tldextract

FROM scratch as runtime-image

COPY --from=prep-image /root/.local /root/.local
COPY --from=prep-image /dmarc .

# Install python.
RUN apt-get install python3

# Run the web service on container startup. Using waitress, in this case.
CMD exec waitress-serve dmarc_scanner:app