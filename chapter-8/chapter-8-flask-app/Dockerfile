FROM node:14-alpine

LABEL author.name="Akshay Kapoor" author.email="akapoor87@gmail.com" author.project="AWS DevOps Simplified"

ENV AWS_REGION=eu-central-1
ENV FLASK_APP=app
ENV FLASK_ENVIRONMENT=production

# Install packages
RUN apk update && apk add --update --no-cache \
    bash \
    python3 \
    py3-pip \
    py-cryptography \
    vim \
    wget \
    curl \
    tree

RUN apk --no-cache add --virtual builds-deps build-base python3

RUN mkdir /opt/aws-devops-simplified

ADD . /opt/aws-devops-simplified/

WORKDIR /opt/aws-devops-simplified/

# Install AWSCLI
RUN pip install --upgrade pip && \
    pip install --upgrade awscli && \
    pip install git-remote-codecommit && \
    pip install -r ./requirements.txt

EXPOSE 5000

CMD [ "python3", "-m", "flask", "run", "--host=0.0.0.0" ]


