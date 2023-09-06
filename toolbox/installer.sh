#!/usr/bin/env bash

# Switch to Cloud9 home directory
pushd /home/ec2-user/environment

# Remove existing readme.md file
rm -f README.md || true

# Setup resources for AWS DevOps Simplified
git init .
git remote add origin https://github.com/akskap/AWS-DevOps-Simplified.git
git fetch origin
git checkout main
rm -rf .git

# Install Tools
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/AmazonLinux/hashicorp.repo
sudo yum install -y yum-utils \
  packer \
  jq

# Inject VPC and Subnet values in packer configurations
DEFAULT_VPC_ID=$(
    aws ec2 describe-vpcs \
    --filters Name=is-default,Values="true" \
    --region eu-central-1 | jq -r ".Vpcs[0].VpcId"
)
SUBNET_ID_DEFAULT_VPC=$(
    aws ec2 describe-subnets \
      --filters Name=vpc-id,Values="${DEFAULT_VPC_ID}" \
      --region eu-central-1 | jq -r ".Subnets[0].SubnetId"
)
sed -i "s/VPC_ID_REPLACE_ME/${DEFAULT_VPC_ID}/g" /home/ec2-user/environment/chapter-3/packer/ami_build.json
sed -i "s/VPC_ID_REPLACE_ME/${DEFAULT_VPC_ID}/g" /home/ec2-user/environment/chapter-5/packer/ami_build.json

sed -i "s/SUBNET_ID_REPLACE_ME/${SUBNET_ID_DEFAULT_VPC}/g" /home/ec2-user/environment/chapter-3/packer/ami_build.json
sed -i "s/SUBNET_ID_REPLACE_ME/${SUBNET_ID_DEFAULT_VPC}/g" /home/ec2-user/environment/chapter-5/packer/ami_build.json
