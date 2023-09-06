import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3_notifications from 'aws-cdk-lib/aws-s3-notifications';
import { AttributeType, Table, TableClass} from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class Chapter6Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamodbTable = new Table(this, 'image_labels', {
      partitionKey: {
        name: "object_key",
        type: AttributeType.STRING
      }
    })

    const bucket = new s3.Bucket(this, 'image_bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    const imageHandler = new lambda.Function(this, "image_handler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset('resources/lambda'),
      environment: {
        'IMAGE_LABELS_TABLE': dynamodbTable.tableName
      },
      handler: 'image.lambda_handler'
    })

    // Add appropriate permissions for Lambda to work with S3, Rekognition and DynamoDB
    const rekognitionPermissionsForLambda = new iam.PolicyStatement();
    rekognitionPermissionsForLambda.addActions("rekognition:*");
    rekognitionPermissionsForLambda.addResources("*");

    const s3PermissionsForLambda = new iam.PolicyStatement();
    s3PermissionsForLambda.addActions("s3:*");
    s3PermissionsForLambda.addResources(bucket.bucketArn);
    s3PermissionsForLambda.addResources(bucket.bucketArn + "/*");

    const dynamodbPermissionsForLambda = new iam.PolicyStatement();
    dynamodbPermissionsForLambda.addActions("dynamodb:*");
    dynamodbPermissionsForLambda.addResources(dynamodbTable.tableArn);

    const kmsPermissionsForLambda = new iam.PolicyStatement();
    kmsPermissionsForLambda.addActions("kms:*");
    kmsPermissionsForLambda.addResources("*");

    const createLogsPermissionsForLambda = new iam.PolicyStatement();
    createLogsPermissionsForLambda.addActions("logs:CreateLogGroup");
    var logGroupResource = `arn:aws:logs:${process.env.CDK_DEFAULT_REGION}:${process.env.CDK_DEFAULT_ACCOUNT}:*`
    createLogsPermissionsForLambda.addResources(logGroupResource);

    const putLogEventsPermissionsForLambda = new iam.PolicyStatement();
    putLogEventsPermissionsForLambda.addActions("logs:CreateLogStream");
    putLogEventsPermissionsForLambda.addActions("logs:PutLogEvents");
    var logGroupArnResource = `arn:aws:logs:${process.env.CDK_DEFAULT_REGION}:${process.env.CDK_DEFAULT_ACCOUNT}:log-group:/aws/lambda/*:*`
    putLogEventsPermissionsForLambda.addResources(logGroupArnResource);

    imageHandler.addToRolePolicy(rekognitionPermissionsForLambda);
    imageHandler.addToRolePolicy(s3PermissionsForLambda);
    imageHandler.addToRolePolicy(dynamodbPermissionsForLambda);
    imageHandler.addToRolePolicy(kmsPermissionsForLambda);
    imageHandler.addToRolePolicy(createLogsPermissionsForLambda);
    imageHandler.addToRolePolicy(putLogEventsPermissionsForLambda);

    // Trigger lambda function when S3 object is added
    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3_notifications.LambdaDestination(imageHandler));

  }
}
