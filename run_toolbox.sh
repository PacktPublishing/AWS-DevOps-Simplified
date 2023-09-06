#!/usr/bin/env bash

docker run                              \
  -v ~/.aws:/root/.aws/                 \
  -v $(pwd):/opt/aws-devops-simplified/ \
  -it akskap/awsdevopssimplified-toolbox /bin/bash
