import boto3
import logging
import os


def lambda_handler(event, context):
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    logger.info("Received an event from S3:" + str(event))
    rekognition_client = boto3.client("rekognition", region_name="eu-central-1")

    logger.info("Passing S3 object file reference to AWS Rekognition")
    try:
        label_detection_response = rekognition_client.detect_labels(
            Image={
                "S3Object": {
                    "Bucket": event["Records"][0]["s3"]["bucket"]["name"],
                    "Name": event["Records"][0]["s3"]["object"]["key"],
                }
            },
            MaxLabels=5,
            MinConfidence=70,
        )
    except:
        logger.exception(
            "Unexpected exception raised by Rekognition. Please check CloudWatch logs"
        )
        raise

    logger.info("Put identified labels into DynamoDB table")
    ddb_client = boto3.client("dynamodb", region_name="eu-central-1")
    ddb_client.put_item(
        TableName=os.environ["IMAGE_LABELS_TABLE"],
        Item={
            "object_key": {"S": event["Records"][0]["s3"]["object"]["key"]},
            "object_labels": {"S": str(label_detection_response["Labels"])},
        },
    )
