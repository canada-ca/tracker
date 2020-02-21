"""
    Copyright 2019 The Elegant Monkeys
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
        http://www.apache.org/licenses/LICENSE-2.0
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
"""

import http.server
import socketserver
import json
import logging
from cloudevents.sdk.event import v02
from cloudevents.sdk import marshaller
import io

m = marshaller.NewDefaultHTTPMarshaller()


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """Handle requests in a separate thread."""


class CloudeventsServer(object):
    """Listen for incoming HTTP cloudevents requests.
    cloudevents request is simply a HTTP Post request following a well-defined
    of how to pass the event data.
    """
    def __init__(self, port=8080):
        self.port = port

    def start_receiver(self, func):
        """Start listening to HTTP requests
        :param func: the callback to call upon a cloudevents request
        :type func: cloudevent -> none
        """
        class BaseHttp(http.server.BaseHTTPRequestHandler):
            def do_POST(self):
                content_type = self.headers.get('Content-Type')
                content_len = int(self.headers.get('Content-Length'))
                headers = dict(self.headers)
                data = self.rfile.read(content_len)
                data = data.decode('utf-8')

                if content_type != 'application/json':
                    data = io.StringIO(data)

                event = v02.Event()
                event = m.FromRequest(event, headers, data, json.loads)
                func(event)
                self.send_response(204)
                self.end_headers()
                return

        socketserver.TCPServer.allow_reuse_address = True
        with ThreadedHTTPServer(("", self.port), BaseHttp) as httpd:
            try:
                logging.info("serving at port {}".format(self.port))
                httpd.serve_forever()
            except:
                httpd.server_close()
                raise
