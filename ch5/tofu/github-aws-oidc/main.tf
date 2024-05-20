provider "aws" {
  region = "us-east-2"
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"                  
  client_id_list  = ["sts.amazonaws.com"]                                          
  thumbprint_list = [data.tls_certificate.github.certificates[0].sha1_fingerprint] 
}

data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_role" "lambda_tests" {
  name               = "lambda-tests"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy_for_tests.json
}

data "aws_iam_policy_document" "assume_role_policy_for_tests" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn] 
      type        = "Federated"
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      # TODO: fill in your own repo name here!
      values   = ["repo:brikis98/fundamentals-of-devops-examples:*"]     
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "test_serverless_app" {
  role   = aws_iam_role.lambda_tests.id
  policy = data.aws_iam_policy_document.test_serverless_app.json
}

data "aws_iam_policy_document" "test_serverless_app" {
  statement {
    sid    = "IamPermissions"
    effect = "Allow"
    actions = [
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:UpdateRole",
      "iam:PassRole",
      "iam:List*Role*",
      "iam:Get*Role*"
    ]
    resources = ["arn:aws:iam::*:role/sample-app*"]
  }

  statement {
    sid       = "ServerlessPermissions"
    effect    = "Allow"
    actions   = ["lambda:*", "apigateway:*", "apigatewayv2:*"]
    resources = ["*"]
  }
}

resource "aws_iam_role" "lambda_deploy_plan" {
  name               = "lambda-deploy-plan"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy_for_tests.json
}

resource "aws_iam_role_policy" "plan_serverless_app" {
  role   = aws_iam_role.lambda_deploy_plan.id
  policy = data.aws_iam_policy_document.plan_serverless_app.json
}

data "aws_iam_policy_document" "plan_serverless_app" {
  statement {
    sid    = "IamReadOnlyPermissions"
    effect = "Allow"
    actions = [
      "iam:List*Role*",
      "iam:Get*Role*"
    ]
    resources = ["arn:aws:iam::*:role/sample-app*"]
  }

  statement {
    sid       = "ServerlessReadOnlyPermissions"
    effect    = "Allow"
    actions   = ["lambda:Get*", "lambda:List*", "apigateway:GET", "apigatewayv2:Get*"]
    resources = ["*"]
  }

  
  statement {
    sid       = "TofuStateS3ReadOnlyPermissions"
    effect    = "Allow"
    actions   = ["s3:Get*", "s3:List*"]
    resources = [local.state_bucket_arn, "${local.state_bucket_arn}/*"]
  }
}

locals {

  state_bucket_arn = "arn:aws:s3:::fundamentals-of-devops-tofu-state"
}

resource "aws_iam_role" "lambda_deploy_apply" {
  name               = "lambda-deploy-apply"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy_for_deploy.json
}

data "aws_iam_policy_document" "assume_role_policy_for_deploy" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
      type        = "Federated"
    }

    
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      # TODO: fill in your own repo name here!
      values   = ["repo:brikis98/fundamentals-of-devops-examples:ref:refs/heads/main"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "apply_serverless_app" {
  role   = aws_iam_role.lambda_deploy_apply.id
  policy = data.aws_iam_policy_document.apply_serverless_app.json
}

data "aws_iam_policy_document" "apply_serverless_app" {
  statement {
    sid    = "IamPermissions"
    effect = "Allow"
    actions = [
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:UpdateRole",
      "iam:PassRole",
      "iam:List*Role*",
      "iam:Get*Role*"
    ]
    resources = ["arn:aws:iam::*:role/sample-app*"]
  }

  statement {
    sid       = "ServerlessPermissions"
    effect    = "Allow"
    actions   = ["lambda:*", "apigateway:*", "apigatewayv2:*"]
    resources = ["*"]
  }

  
  statement {
    sid       = "TofuStateS3Permissions"
    effect    = "Allow"
    actions   = ["s3:*"]
    resources = [local.state_bucket_arn, "${local.state_bucket_arn}/*"]
  }

  statement {
    sid       = "TofuStateDynamoPermissions"
    effect    = "Allow"
    actions   = ["dynamodb:*"]
    resources = ["arn:aws:dynamodb:*:*:table/fundamentals-of-devops-tofu-locks"]
  }
}
