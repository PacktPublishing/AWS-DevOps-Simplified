FROM node:14-alpine

LABEL author.name="Akshay Kapoor" author.email="akapoor87@gmail.com" author.project="AWS DevOps Simplified"

ENV AWS_REGION=eu-central-1

# Install packages
RUN apk update && apk add --update --no-cache \
    git \
    bash \
    curl \
    openssh \
    python3 \
    py3-pip \
    py-cryptography \
    vim \
    wget \
    packer \
    curl \
    tree

RUN apk --no-cache add --virtual builds-deps build-base python3

RUN npm install -g aws-cdk && \
    npm install aws-cdk-lib

# Install AWSCLI
RUN pip install --upgrade pip && \
    pip install --upgrade awscli && \
    pip install git-remote-codecommit

RUN git clone https://github.com/akskap/AWS-DevOps-Simplified.git /opt/aws-devops-simplified

