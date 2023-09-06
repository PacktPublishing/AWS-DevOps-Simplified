import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Pipeline, Artifact } from 'aws-cdk-lib/aws-codepipeline'
import { Repository } from 'aws-cdk-lib/aws-codecommit';
import { CodeBuildAction, CodeCommitSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
// import { CodePipeline } from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class DeliveryPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repo = new Repository(this, 'ImageDeliveryPipelineRepo', {
      repositoryName: 'image-delivery-pipeline',
    });

    const ecr_repo = new ecr.Repository(this, 'ECRRepository', {
      repositoryName: "aws-devops-simplified/devsecops-tutorial"
    });

    const scaCodebuildProject = new codebuild.PipelineProject(this, 'SCAValidate',{
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspecs/sca.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
        privileged: true,
      },
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.CUSTOM)
    });

    const sastCodebuildProject = new codebuild.PipelineProject(this, 'SASTValidate',{
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspecs/sast.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
        privileged: true,
      },
    });
    
    const dockerLintCodebuildProject = new codebuild.PipelineProject(this, 'DockerLint',{
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspecs/dockerlint.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
        privileged: true,
      },
    });

    const dockerImageBuildCodebuildProject = new codebuild.PipelineProject(this, 'DockerImageBuild',{
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspecs/dockerimagebuild.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
        privileged: true,
        environmentVariables: 
        {
          "ECR_REPO_URL": { value: ecr_repo.repositoryUri },
          "AWS_REGION": { value: process.env.CDK_DEFAULT_REGION },
        }
      },
    });

    const buildRolePolicy =  new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:GetRepositoryPolicy",
                "ecr:DescribeRepositories",
                "ecr:ListImages",
                "ecr:DescribeImages",
                "ecr:BatchGetImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage"
            ]
    });
    // scaCodebuildProject.addToRolePolicy(buildRolePolicy);
    dockerImageBuildCodebuildProject.addToRolePolicy(buildRolePolicy);

    const sourceOutput = new Artifact();
    // const validationOutput = new Artifact();

    const sourceAction = new CodeCommitSourceAction({
      actionName: 'FetchSource',
      repository: repo,
      output: sourceOutput,
    });

    const checkSourceCompositionAction = new CodeBuildAction({
      actionName: 'SCACheck',
      input: sourceOutput,
      project: scaCodebuildProject
    })

    const staticApplicationTestingAction = new CodeBuildAction({
      actionName: 'SASTCheck',
      input: sourceOutput,
      project: sastCodebuildProject
    })

    const lintDockerFileAction =  new CodeBuildAction({
      actionName: 'DockerfileCheck',
      input: sourceOutput,
      project: dockerLintCodebuildProject
    })

    const dockerImageBuildAction =  new CodeBuildAction({
      actionName: 'DockerImageBuild',
      input: sourceOutput,
      project: dockerImageBuildCodebuildProject
    })

    const imageDeliveryPipeline = new Pipeline(this, 'ImageDeliveryPipeline', {
      pipelineName: "ImageDeliveryPipeline",
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction]
        },
        {
          stageName: "ApplicationValidation",
          actions: [checkSourceCompositionAction, staticApplicationTestingAction]
        },
        {
          stageName: "PlatformValidation",
          actions: [lintDockerFileAction]
        },
        {
          stageName: "Build",
          actions: [dockerImageBuildAction]
        },
      ]
    });
  }
}
