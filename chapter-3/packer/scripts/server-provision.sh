#!/usr/bin/env bash

# Update apt packages
set -ex
sudo yum -y update && sudo yum install -y wget && sudo yum install -y pip

# Creating required directory and install python libraries
echo -e "\nRunning scripts as '$(whoami)'\n\n"

sudo mkdir -p /opt/ads-server/

sudo pip3 install requests

# Place server initiation file at the expected location
cat > ~/server.py << EOF
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
        self.wfile.write(bytes("<p>AWS DevOps Simplified - Simple HTTP Server</p>", "utf-8"))
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
EOF

# Configuring Runner PreStart, Start and Stop Scripts
cat > ~/start-server << EOF
/usr/bin/python3 /opt/ads-server/server.py 
EOF

cat > ~/post-start-server << EOF
echo "post start activity"
EOF

cat > ~/stop-server << EOF
echo "stopping server"
EOF

echo -e "\nMaking scripts executable"
chmod +x ~/{start,post-start,stop}-server

# Copy scripts to /usr/bin/
sudo cp ~/{start,post-start,stop}-server /usr/bin/
sudo cp ~/server.py /opt/ads-server/

echo -e "\nConfigure ADS Sample Server Service Unit File"

cat > ~/ads-server.service << EOF
[Unit]
Description=ADS Sample Server
After=syslog.target network.target
ConditionFileIsExecutable=/usr/bin/start-server
[Service]
StartLimitInterval=5
StartLimitBurst=10
ExecStart=/bin/bash /usr/bin/start-server
ExecStartPost=/bin/bash /usr/bin/post-start-server
ExecStop=/bin/bash /usr/bin/stop-server
Restart=always
RestartSec=120
[Install]
WantedBy=multi-user.target
EOF

# Move SystemD service unit file to /etc/systemd/system
sudo mv ~/ads-server.service /etc/systemd/system/
sudo systemctl enable ads-server

# Service file changed - refresh systemd daemon
sudo systemctl daemon-reload
