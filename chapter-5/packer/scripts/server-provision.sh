#!/usr/bin/env bash

# Update apt packages
set -ex
sudo yum -y update && sudo yum install -y wget && sudo yum install -y pip

# Setup web server directory
sudo mkdir -p /opt/ads-server/

# Installing CodeDeploy agent in the instance
sudo yum -y install ruby wget

# Clean any pre-existing agent cache from the image
CODEDEPLOY_BIN="/opt/codedeploy-agent/bin/codedeploy-agent"
sudo $CODEDEPLOY_BIN stop || true
sudo yum erase codedeploy-agent -y || true

# Download the agent and install it
sudo su - ec2-user
sudo wget https://aws-codedeploy-eu-central-1.s3.eu-central-1.amazonaws.com/latest/install
sudo chmod +x ./install
sudo ./install auto
