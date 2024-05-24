resource "aws_iam_role" "lambda_tests" {
  count              = var.enable_iam_role_for_testing ? 1 : 0
  name               = "${var.name}-tests"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy_for_tests[0].json
}

data "aws_iam_policy_document" "assume_role_policy_for_tests" {
  count = var.enable_iam_role_for_testing ? 1 : 0

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      identifiers = [var.oidc_provider_arn]
      type        = "Federated"
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:*"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "test_serverless_app" {
  count = var.enable_iam_role_for_testing ? 1 : 0

  role   = aws_iam_role.lambda_tests[0].id
  policy = data.aws_iam_policy_document.test_serverless_app[0].json
}

data "aws_iam_policy_document" "test_serverless_app" {
  count = var.enable_iam_role_for_testing ? 1 : 0

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
    resources = ["arn:aws:iam::*:role/${var.lambda_base_name}*"]
  }

  statement {
    sid       = "ServerlessPermissions"
    effect    = "Allow"
    actions   = ["lambda:*", "apigateway:*", "apigatewayv2:*"]
    resources = ["*"]
  }
}

resource "aws_iam_role" "lambda_deploy_plan" {
  count              = var.enable_iam_role_for_plan ? 1 : 0
  name               = "${var.name}-plan"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy_for_plan[0].json
}

data "aws_iam_policy_document" "assume_role_policy_for_plan" {
  count = var.enable_iam_role_for_plan ? 1 : 0

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      identifiers = [var.oidc_provider_arn]
      type        = "Federated"
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:*"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "plan_serverless_app" {
  count  = var.enable_iam_role_for_plan ? 1 : 0
  role   = aws_iam_role.lambda_deploy_plan[0].id
  policy = data.aws_iam_policy_document.plan_serverless_app[0].json
}

data "aws_iam_policy_document" "plan_serverless_app" {
  count = var.enable_iam_role_for_plan ? 1 : 0

  statement {
    sid    = "IamReadOnlyPermissions"
    effect = "Allow"
    actions = [
      "iam:List*Role*",
      "iam:Get*Role*"
    ]
    resources = ["arn:aws:iam::*:role/${var.lambda_base_name}*"]
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
  state_bucket_arn = "arn:aws:s3:::${var.tofu_state_bucket}"
}

resource "aws_iam_role" "lambda_deploy_apply" {
  count = var.enable_iam_role_for_apply ? 1 : 0

  name               = "${var.name}-apply"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy_for_apply[0].json
}

data "aws_iam_policy_document" "assume_role_policy_for_apply" {
  count = var.enable_iam_role_for_apply ? 1 : 0

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      identifiers = [var.oidc_provider_arn]
      type        = "Federated"
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:ref:refs/heads/main"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "apply_serverless_app" {
  count  = var.enable_iam_role_for_apply ? 1 : 0
  role   = aws_iam_role.lambda_deploy_apply[0].id
  policy = data.aws_iam_policy_document.apply_serverless_app[0].json
}

data "aws_iam_policy_document" "apply_serverless_app" {
  count = var.enable_iam_role_for_apply ? 1 : 0

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
    resources = ["arn:aws:iam::*:role/${var.lambda_base_name}*"]
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
    resources = ["arn:aws:dynamodb:*:*:table/${var.tofu_state_dynamodb_table}"]
  }
}
