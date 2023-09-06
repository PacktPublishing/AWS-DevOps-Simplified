# Python 3 server example
from http.server import BaseHTTPRequestHandler, HTTPServer
import time
import requests

hostName = "0.0.0.0"
serverPort = 8080

class MyServer(BaseHTTPRequestHandler):
    def do_GET(self):
        token_url = "http://169.254.169.254/latest/api/token"
        headers = {'X-aws-ec2-metadata-token-ttl-seconds': '21600'}
        metadata_token = requests.put(token_url, headers=headers).content
        instance_id_headers = {'X-aws-ec2-metadata-token': metadata_token}
        instance_id_url = "http://169.254.169.254/1.0/meta-data/instance-id"
        metadata_api = requests.get(instance_id_url, headers=instance_id_headers)
        instance_id = metadata_api.content
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(bytes("<html><head><title>AWS DevOps Simplified</title></head>", "utf-8"))
        self.wfile.write(bytes("<p>Request: %s</p>" % self.path, "utf-8"))
        self.wfile.write(bytes("<body>", "utf-8"))
        self.wfile.write(bytes("<p>AWS DevOps Simplified - Simple HTTP Server - V1</p>", "utf-8"))
        self.wfile.write(bytes("<p>Response received from - " + instance_id.decode("utf-8")  + "</p>", "utf-8"))
        self.wfile.write(bytes("</body></html>", "utf-8"))

if __name__ == "__main__":
    webServer = HTTPServer((hostName, serverPort), MyServer)
    print("Server started http://%s:%s" % (hostName, serverPort))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")
